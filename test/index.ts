import isWindows = require('is-windows')
import test = require('tape')
import tempy = require('tempy')
import unpackStream = require('unpack-stream')
import fs = require('fs')
import path = require('path')
import ignore = require('ignorable')

const IS_WINDOWS = isWindows()

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

test('set dir permissions when unpacking tarball', t => {
  const tarballLoc = path.join(__dirname, 'kitsu-bad-dir-permissions-5.0.6.tgz')
  const dest = path.join(__dirname, 'dest')
  unpackStream.local(fs.createReadStream(tarballLoc), dest)
    .then(index => {
      t.ok(Object.keys(index).indexOf('CHANGELOG.md') >= 0)
      t.end()
    })
    .catch(() => {
      t.ok(false, "could not unpack kitsu")
      t.end()
    })
})

test('unpack tarball that has files with same name', t => {
  const tarballLoc = path.join(__dirname, 'with-same-file-in-different-cases-1.0.0.tgz')
  const dest = tempy.directory()
  t.comment(`dest dir ${dest}`)
  unpackStream.local(fs.createReadStream(tarballLoc), dest)
    .then(index => {
      t.deepEqual(Object.keys(index), IS_WINDOWS ? ['package.json', 'foo.js'] : ['package.json', 'foo.js', 'Foo.js'])
      return index['package.json'].generatingIntegrity
    })
    .then(integrity => {
      t.ok(integrity)
      t.ok(typeof integrity === 'object')
      t.end()
    })
    .catch(t.end)
})
