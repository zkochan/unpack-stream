import crypto = require('crypto')
import decompress = require('decompress-maybe')
import tar = require('tar-fs')
import { IncomingMessage } from 'http'
import ssri = require('ssri')
import { Duplex } from 'stream';

export type UnpackProgress = (downloaded: number, totalSize: number) => void

export interface UnpackRemoteStreamOptions extends UnpackLocalStreamOptions {
  onStart?: () => void,
  onProgress?: UnpackProgress,
  shasum?: string,
}

export function remote (
  stream: IncomingMessage,
  dest: string,
  opts: UnpackRemoteStreamOptions = {},
) {
  return new Promise<Index>((resolve, reject) => {
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

    const streamToUnpack = stream
      .on('data', (_: Buffer) => { actualShasum.update(_) })
      .on('error', reject)

    local(streamToUnpack, dest, opts).then(finish).catch(reject)

    // without pausing, gunzip/tar-fs would miss the beginning of the stream
    if (stream.resume) stream.resume()

    function finish (index: Index) {
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
  [filename: string]: {
    size: number,
    generatingIntegrity?: Promise<ssri.IntegrityMap>,
  },
}

export interface UnpackLocalStreamOptions {
  generateIntegrity?: boolean,
  ignore?: (filename: string) => boolean,
}

export function local (
  stream: NodeJS.ReadableStream,
  dest: string,
  opts: UnpackLocalStreamOptions = {}
) {
  const ignore = opts.ignore ? function (filename: string, header?: {name: string}) {
    return opts.ignore!((header && header.name) || filename)
  } : function () { return false }
  const generateIntegrity = opts.generateIntegrity !== false
  const headers: Index = {}
  return new Promise<Index>((resolve, reject) => {
    stream
      .on('error', reject)
      .pipe(decompress() as Duplex).on('error', reject)
      .pipe(
        tar.extract(dest, {
          chown: false, // Don't chown. Just leave as it is
          dmode: 0o755, // All directories should be readable
          fmode: 0o644, // All files should be readable
          ignore,
          mapStream (fileStream, header) {
            headers[header.name] = header
            if (generateIntegrity) {
              headers[header.name].generatingIntegrity = ssri.fromStream(fileStream)
            }
            return fileStream
          },
          strip: 1,
        } as tar.ExtractOptions)
      )
      .on('error', reject)
      .on('finish', () => {
        resolve(headers)
      })
  })
}
