import test = require('tape')
import unpackStream = require('../src')
import fs = require('fs')
import path = require('path')
import ignore = require('ignorable')

test('unpack local tarball', t => {
  const tarballLoc = path.join(__dirname, 'babel-helper-hoist-variables-6.24.1.tgz')
  const dest = path.join(__dirname, 'dest')
  unpackStream.local(fs.createReadStream(tarballLoc), dest)
    .then(index => {
      t.deepEqual(Object.keys(index['headers']), ['package.json', '.npmignore', 'README.md', 'lib/index.js'])
      return index['integrityPromise']
    })
    .then(integrity => {
      t.ok(integrity['package.json']['integrity'])
      t.end()
    })
    .catch(t.end)
})

test('unpack local tarball, don\'t generate integrity', t => {
  const tarballLoc = path.join(__dirname, 'babel-helper-hoist-variables-6.24.1.tgz')
  const dest = path.join(__dirname, 'dest')
  unpackStream.local(fs.createReadStream(tarballLoc), dest, {generateIntegrity: false})
    .then(index => {
      t.deepEqual(Object.keys(index['headers']), ['package.json', '.npmignore', 'README.md', 'lib/index.js'])
      t.notOk(index['integrityPromise'])
      t.end()
    })
    .catch(t.end)
})

test("unpack only the files that are not ignored", t => {
  const tarballLoc = path.join(__dirname, 'babel-helper-hoist-variables-6.24.1.tgz')
  const dest = path.join(__dirname, 'dest')
  unpackStream.local(fs.createReadStream(tarballLoc), dest, {ignore})
    .then(index => {
      t.deepEqual(Object.keys(index['headers']), ['package.json', 'lib/index.js'])
      t.ok(index['integrityPromise'])
      t.end()
    })
    .catch(t.end)
})
