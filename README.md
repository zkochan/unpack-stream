this package was used by pre-v5 versions of pnpm

now it is not used anymore

# unpack-stream

> Unpack a tarball stream

<!--@shields('npm', 'travis')-->
[![npm version](https://img.shields.io/npm/v/unpack-stream.svg)](https://www.npmjs.com/package/unpack-stream) [![Build Status](https://img.shields.io/travis/zkochan/unpack-stream/master.svg)](https://travis-ci.org/zkochan/unpack-stream)
<!--/@-->

## Installation

```sh
npm i -S unpack-stream
```

## Usage

<!--@example('./example.js')-->
```js
'use strict'
const got = require('got')
const unpackStream = require('unpack-stream')

const tarball = 'https://registry.npmjs.org/is-negative/-/is-negative-2.1.0.tgz'
const stream = got.stream(tarball)
unpackStream.remote(stream, './tmp')
  .then(index =>
    Promise.all(
      Object.keys(index)
        .map(filename =>
          index[filename].generatingIntegrity.then(integrity => ({filename, integrity})))
    )
  )
  .then(files => console.log(files))
  //> [ { filename: 'package.json',
  //      integrity: 'sha512-RA0APKvtxz85WYCFX3M/TkVeJZZBcylEwh+GrV7uO/NNJO4G3rzgTrpsypp9AU2hM2QBk9SxCHi1Gb9aaWzpYg==' },
  //    { filename: 'index.js',
  //      integrity: 'sha512-3dL1OHn8VWhVDT37f3ZBdou4NrYq2ll//W1lWqx7+4tKBW/WqUx3mDcGyqrBfBeWTIPCd+RiUdF7hp3MQYB9+g==' },
  //    { filename: 'license',
  //      integrity: 'sha512-lSw93JVg7wfwyVXKrg6yIFjF9Bidgr+tA/l6XNlrRhjnE6NhwkyPL3xNL47OZScS8qoQkYUwE6slmo7jGesH0Q==' },
  //    { filename: 'readme.md',
  //      integrity: 'sha512-fM882axp7XaC6nzj5XYuzB0KhYpYwwsR3RjyiqOcIrI6C0b9KxrEEug9VpKTfbSbqTOmZ2KEqZLPKrMXFW1Y+g==' } ]
```
<!--/@-->

## API

### `remote(stream, destination, [opts]): Promise<Index>`

Unpacks a remote stream fetched via HTTP.

**Arguments:**

- `stream` - _Stream_
- `destination` - _string_ - the directory to which the stream will be unpacked
- `[opts.shasum]` - _string_ - shasum to verify tarball
- `[opts.onStart]` - _Function_ - called on download start
- `[opts.onProgress]` - _(downloaded, size) => void_ - tracks the download progress
- `[opts.generateIntegrity]` - _Boolean_ - `true` by default. If `true`, generates [Subresource Integrity](https://w3c.github.io/webappsec-subresource-integrity/) for each unpacked file
- `[opts.ignore]` - `(filename: string) => boolean` - a function that decides whether a file should be unpacked from the tarball.

### `local(stream, destination, [opts]): Promise<Index>`

Unpacks a stream from the local filesystem.

**Arguments:**

- `[opts.generateIntegrity]` - _Boolean_ - `true` by default. If `true`, generates [Subresource Integrity](https://w3c.github.io/webappsec-subresource-integrity/) for each unpacked file
- `[opts.ignore]` - `(filename: string) => boolean` - a function that decides whether a file should be unpacked from the tarball.

## License

[MIT](./LICENSE) © [Zoltan Kochan](https://www.kochan.io)
