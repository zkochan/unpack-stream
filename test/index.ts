import test = require('tape')
import unpackStream = require('unpack-stream')
import fs = require('fs')
import path = require('path')
import ignore = require('ignorable')

test('unpack local tarball', t => {
  const tarballLoc = path.join(__dirname, 'babel-helper-hoist-variables-6.24.1.tgz')
  const dest = path.join(__dirname, 'dest')
  unpackStream.local(fs.createReadStream(tarballLoc), dest)
    .then(index => {
      t.deepEqual(Object.keys(index), ['package.json', '.npmignore', 'README.md', 'lib/index.js'])
      return index['package.json'].generatingIntegrity
    })
    .then(integrity => {
      t.ok(integrity)
      t.ok(typeof integrity === 'object')
      t.end()
    })
    .catch(t.end)
})

test('unpack local tarball, don\'t generate integrity', t => {
  const tarballLoc = path.join(__dirname, 'babel-helper-hoist-variables-6.24.1.tgz')
  const dest = path.join(__dirname, 'dest')
  unpackStream.local(fs.createReadStream(tarballLoc), dest, {generateIntegrity: false})
    .then(index => {
      t.deepEqual(Object.keys(index), ['package.json', '.npmignore', 'README.md', 'lib/index.js'])
      t.notOk(index['package.json']['generatingIntegrity'])
      t.end()
    })
    .catch(t.end)
})

test("unpack only the files that are not ignored", t => {
  const tarballLoc = path.join(__dirname, 'babel-helper-hoist-variables-6.24.1.tgz')
  const dest = path.join(__dirname, 'dest')
  unpackStream.local(fs.createReadStream(tarballLoc), dest, {ignore})
    .then(index => {
      t.deepEqual(Object.keys(index), ['package.json', 'lib/index.js'])
      t.ok(index['package.json']['generatingIntegrity'])
      t.end()
    })
    .catch(t.end)
})
