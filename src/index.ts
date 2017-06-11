import crypto = require('crypto')
import decompress = require('decompress-maybe')
import tar = require('tar-fs')
import {IncomingMessage} from 'http'
import {set} from 'setvalue'
import ssri = require('ssri')

export type UnpackProgress = (downloaded: number, totalSize: number) => void

export type UnpackRemoteStreamOptions = {
  onStart?: () => void,
  onProgress?: UnpackProgress,
  shasum?: string
}

export function remote (stream: IncomingMessage, dest: string, opts: UnpackRemoteStreamOptions) {
  opts = opts || {}
  return new Promise((resolve, reject) => {
    const actualShasum = crypto.createHash('sha1')

    local(
      stream
        .on('response', start)
        .on('data', (_: Buffer) => { actualShasum.update(_) })
        .on('error', reject), dest
    ).then(finish).catch(reject)

    // without pausing, gunzip/tar-fs would miss the beginning of the stream
    if (stream.resume) stream.resume()

    function start (res: IncomingMessage) {
      if (res.statusCode !== 200) {
        return reject(new Error(`Invalid response: ${res.statusCode}`))
      }

      if (opts.onStart) opts.onStart()
      if (opts.onProgress && ('content-length' in res.headers)) {
        const onProgress = opts.onProgress
        let downloaded = 0
        let size = +res.headers['content-length']
        res.on('data', (chunk: Buffer) => {
          downloaded += chunk.length
          onProgress(downloaded, size)
        })
      }
    }

    function finish (index: {}) {
      const digest = actualShasum.digest('hex')
      if (opts.shasum && digest !== opts.shasum) {
        reject(new Error(`Incorrect shasum (expected ${opts.shasum}, got ${digest})`))
        return
      }

      resolve(index)
    }
  })
}

export function local (stream: NodeJS.ReadableStream, dest: string) {
  const index = {}
  const integrityPromises: Promise<{}>[] = []
  return new Promise((resolve, reject) => {
    stream
      .pipe(decompress()).on('error', reject)
      .pipe(
        tar.extract(dest, {
          strip: 1,
          mapStream (fileStream: NodeJS.ReadableStream, header: {name: string}) {
            integrityPromises.push(
              ssri.fromStream(fileStream)
                .then((sri: {}) => {
                  set(index, header.name.split('/'), {
                    integrity: sri.toString(),
                    type: header['type'],
                    size: header['size'],
                    mtime: header['mtime'],
                  })
                })
            )
            return fileStream
          },
        })
      ).on('error', reject)
      .on('finish', () => {
        Promise.all(integrityPromises)
          .then(() => resolve(index))
          .catch(reject)
      })
  })
}
