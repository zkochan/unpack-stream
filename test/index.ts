import test = require('tape')
import unpackStream = require('../src')
import fs = require('fs')
import path = require('path')

test('unpack local tarball', t => {
  const tarballLoc = path.join(__dirname, 'babel-helper-hoist-variables-6.24.1.tgz')
  const dest = path.join(__dirname, 'dest')
  unpackStream.local(fs.createReadStream(tarballLoc), dest)
    .then(() => t.end())
    .catch(t.end)
})
