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

const tarball = 'http://registry.npmjs.org/is-negative/-/is-negative-2.1.0.tgz'
const stream = got.stream(tarball)
unpackStream.remote(stream, './tmp')
```
<!--/@-->

## API

### `remote(stream, destination, [opts]): Promise<void>`

Unpacks a remote stream fetched via HTTP.

**Arguments:**

* `stream` - *Stream*
* `destination` - *string* - the directory to which the stream will be unpacked
* `[opts.shasum]` - *string* - shasum to verify tarball
* `[opts.onStart]` - *Function* - called on download start
* `[opts.onProgress]` - *(downloaded, size) => void* - tracks the download progress

### `local(stream, destination): Promise<void>`

Unpacks a stream from the local filesystem.

## License

[MIT](./LICENSE) © [Zoltan Kochan](http://kochan.io)
