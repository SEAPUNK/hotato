'use strict'

const Promise = require('bluebird')
const _ = require('lodash')
const isPromise = require('is-promise')
const maybestack = require('maybestack')
const util = require('util')
const keypress = require('keypress')
const interopRequire = require('interop-require')

const prefix = '[hotato]'

keypress(process.stdin)

function HotatoError (message) {
  this.name = 'HotatoError'
  this.message = message
  this.stack = (new Error()).stack
}

HotatoError.prototype = new Error()

const runHotato = Promise.coroutine(function * (resolvedModules, loopFn) {
  if (!_.isArray(resolvedModules)) throw new HotatoError('resolvedModules argument is not an array')
  if (!_.isFunction(loopFn)) throw new HotatoError('loopFn is not a function')

  let firstRun = true

  while (true) {
    if (!firstRun) console.log(`${prefix} Re-running loop.`)
    if (firstRun) firstRun = false

    const loadedModules = []

    // (Re)load the modules.
    for (let resolvedModule of resolvedModules) {
      const status = reloadModule(resolvedModule)
      if (status.err) {
        console.log(`${prefix} Could not reload module '${resolvedModule}': ${maybestack(status.err)}`)
        const reRun = yield awaitInput()
        if (reRun) continue
        throw status.err
      } else {
        loadedModules.push(status.module)
      }
    }

    console.log(`${prefix} Running loop with reloaded modules: ${util.inspect(resolvedModules)}`)

    // Call the loop function.
    let returnValue
    let resolved

    const loopPromise = loopFn.apply(loopFn, loadedModules)
    if (!isPromise(loopPromise)) {
      throw new HotatoError('loopFn does not return a promise')
    }

    try {
      returnValue = yield loopPromise
      resolved = true
    } catch (err) {
      returnValue = err
      resolved = false
    }

    if (!resolved) {
      console.log(`${prefix} Loop rejected: ${maybestack(returnValue)}`)
    } else {
      console.log(`${prefix} Loop run OK, with returned value: ${util.inspect(returnValue)}`)
    }

    const reRun = yield awaitInput()
    if (reRun) {
      continue
    } else {
      if (resolved) return returnValue
      else throw returnValue
    }
  }
})

function awaitInput (resolve) {
  let _resolve
  let promise
  if (!resolve) {
    promise = new Promise((resolve, reject) => _resolve = resolve)
  } else {
    _resolve = resolve
  }

  process.stdin.resume()
  console.log(`${prefix} Awaiting input. Enter "r" to re-run loop, or "c" to continue.`)
  process.stdout.write('[hotato> ')
  process.stdin.once('keypress', (ch, key) => {
    process.stdin.pause()
    if (key && key.name === 'r') {
      return resolve(true)
    } else if (key && key.name === 'c') {
      return resolve(false)
    } else {
      console.log(`${prefix} Unknown key.`)
      return awaitInput(resolve)
    }
  })

  return promise
}

function reloadModule (module) {
  try {
    delete require.cache[module]
    return {module: interopRequire(module)}
  } catch (err) {
    return {err: err}
  }
}

module.exports = runHotato
