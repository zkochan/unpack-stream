'use strict'
const got = require('got')
const unpackStream = require('./dist')

const tarball = 'http://registry.npmjs.org/is-negative/-/is-negative-2.1.0.tgz'
const stream = got.stream(tarball)
unpackStream.remote(stream, './tmp')
