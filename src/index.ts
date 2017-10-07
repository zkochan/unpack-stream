import crypto = require('crypto')
import decompress = require('decompress-maybe')
import tar = require('tar-fs')
import {IncomingMessage} from 'http'
import ssri = require('ssri')

export type UnpackProgress = (downloaded: number, totalSize: number) => void

export type UnpackRemoteStreamOptions = {
  onStart?: () => void,
  onProgress?: UnpackProgress,
  shasum?: string,
  generateIntegrity?: boolean,
}

export function remote (
  stream: IncomingMessage,
  dest: string,
  opts: UnpackRemoteStreamOptions
) {
  opts = opts || {}
  return new Promise((resolve, reject) => {
    const actualShasum = crypto.createHash('sha1')

    if (typeof stream.statusCode === 'number' && stream.statusCode !== 200) {
      return reject(new Error(`Invalid response: ${stream.statusCode}`))
    }

    if (opts.onStart) opts.onStart()
    if (opts.onProgress && stream.headers['content-length']) {
      const onProgress = opts.onProgress
      let downloaded = 0
      let size = parseInt(<string>stream.headers['content-length'])
      stream.on('data', (chunk: Buffer) => {
        downloaded += chunk.length
        onProgress(downloaded, size)
      })
    }

    local(
      stream
        .on('data', (_: Buffer) => { actualShasum.update(_) })
        .on('error', reject), dest
    ).then(finish).catch(reject)

    // without pausing, gunzip/tar-fs would miss the beginning of the stream
    if (stream.resume) stream.resume()

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

export type Index = {
  headers: {
    [filename: string]: {
      type: 'file',
      size: number,
      mtime: string,
    }
  },
  integrityPromise: Promise<{
    [filename: string]: {
      type: 'file',
      size: number,
      integrity: string,
      mtime: string,
    }
  }>
}

export function local (
  stream: NodeJS.ReadableStream,
  dest: string,
  opts?: {
    generateIntegrity?: boolean,
  }
) {
  opts = opts || {}
  const generateIntegrity = opts.generateIntegrity !== false
  const index = {}
  const headers = {}
  const integrityPromises: Promise<{}>[] = []
  return new Promise((resolve, reject) => {
    stream
      .on('error', reject)
      .pipe(decompress()).on('error', reject)
      .pipe(
        tar.extract(dest, {
          strip: 1,
          mapStream (fileStream: NodeJS.ReadableStream, header: {name: string}) {
            headers[header.name] = header
            if (generateIntegrity) {
              integrityPromises.push(
                ssri.fromStream(fileStream)
                  .then((sri: {}) => {
                    index[header.name] = {
                      integrity: sri.toString(),
                      type: header['type'],
                      size: header['size'],
                      mtime: header['mtime'],
                    }
                  })
              )
            }
            return fileStream
          },
        })
      ).on('error', reject)
      .on('finish', () => {
        if (generateIntegrity) {
          resolve({
            headers,
            integrityPromise: Promise.all(integrityPromises)
              .then(() => index)
          })
          return
        }
        resolve({ headers })
      })
  })
}
