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
