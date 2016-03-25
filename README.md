hotato
===

[![npm](https://img.shields.io/npm/v/hotato.svg?style=flat-square)](https://npmjs.com/package/hotato)
[![standard code style](https://img.shields.io/badge/style-standard-blue.svg?style=flat-square)](https://github.com/feross/standard)

**requires node v4 or newer**

Hotato attempts to provide a solution for the problem of having to restart your program and having to wait until your code gets to the point where the file you made changes to gets tested. **This is strictly meant for development, never use this in your production code!**

Uses the [keypress](https://github.com/TooTallNate/keypress) module for input awaiting. Hotato runs this code on the tty ReadStream, so make sure this won't affect your code before using this module:

```js
// As soon as it gets require()d
keypress(process.stdin)

// When awaiting input:
process.stdin.resume()

// When received input:
process.stdin.pause()
```

---

Example
---

```js
import hotato from 'hotato'

async function doThings () {
    const stuff = await downloadSomething()
    const hotModules = ['./process-stuff', './do-thing'].map((name) => require.resolve(name))
    const number = await hotato(hotModules, async (processStuff, doThing) => {
        console.log(processStuff)
        const thing = await processStuff(stuff)
        doThing(thing)
        return {nice: 5}
    })
    console.log(`got number: ${number.nice}`)
}

```

*in the console*

```
$ node hotato-example.js
downloading stuff
[hotato] Running loop with reloaded modules: [ '/home/ivan/code/__/playground/process-stuff.js',
  '/home/ivan/code/__/playground/do-thing.js' ]
[Function]
[hotato] Loop rejected: Error: could not process stuff
    at process-stuff.js:4:12
    at module.exports (process-stuff.js:2:10)
    at test-hotato.js:18:29
    at test-hotato.js:11:16
    at Function.<anonymous> (test-hotato.js:15:45)
    at test-hotato.js:15:26
[hotato] Awaiting input. Enter "r" to re-run loop, or anything else to continue.
[hotato> 
```

Make changes and fixes to your `process-stuff.js` file, and...

```
[hotato> r
[hotato] Re-running loop.
[hotato] Running loop with reloaded modules: [ '/home/ivan/code/__/playground/process-stuff.js',
  '/home/ivan/code/__/playground/do-thing.js' ]
doing thing
[hotato] Loop run OK, with returned value: { nice: 5 }
[hotato] Awaiting input. Enter "r" to re-run loop, or anything else to continue.
[hotato> 
got number: 5
```

---

`hotato(resolvedNames, loopFn)`

- *Array[String]* resolved module paths
- *Function* loop function that returns a Promise

Uncache and then `require()` the array of resolved names, and pass them to the loop function. Once the loop function is done, regardless of its resolution or rejection, hotato will await your input, which will be to either continue (rejects its own Promise if the loop function rejected or resolves its own Promise if the loop function resolved), or re-run the loop, in which the modules get uncached and required again, with the loop function being called with the modules as arguments.

Returns a Promise, which rejects or resolves however the loop function rejects or resolves on its last run.

---

Possible caveats
---

* You probably don't want to run multiple hotato functions simultaneously, due to duplicate keyboard input listeners.
* Hotato could mess with your code, if it listens for keyboard input.
* Hotato could mess with your code, if the modules you want to recache store internal state (especially if they store crucial state before you run hotato).
* You might not see the prompt in time if your code logs to console other things after the loop finished its run.
