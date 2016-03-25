hotato
===

**requires node v4 or newer**

Hotato attempts to provide a solution for the problem of having to restart your program and having to wait until your code gets to the point where the file you made changes to gets tested.

```js
import hotato from 'hotato'

async function doThings () {
    const stuff = await downloadSomething()
    const hotModules = ['./process-stuff', './do-thing'].map((name) => require.resolve(name))
    const number = await hotato(hotModules, async (processStuff, doThing) => {
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
[hotato] Running loop with reloaded modules: './process-stuff', './do-thing'
processing stuff
[hotato] Loop rejected: Error: could not process stuff
    at processStuff (hotato-example.js:260:27)
[hotato] Awaiting input. Press "c" to continue, or "r" to re-run loop.
[hotato> 
```

Make changes and fixes to your `process-stuff.js` file, and...

```
[hotato> r
[hotato] Re-running loop.
processing stuff
doing thing
[hotato] Loop run OK, with returned value: { nice: 5 }
[hotato] Awaiting input. Press "c" to continue, or "r" to re-run loop.
[hotato> c
got number: 5
```

---

`hotato(resolvedNames, loopFn)`

- *Array[String]* resolved module paths
- *Function* loop function that returns a Promise

Uncache and then `require()` the array of resolved names, and pass them to the loop function. Once the loop function is done, regardless of its resolution or rejection, hotato will await your input, which will be to either continue (rejects its own Promise if the loop function rejected or resolves its own Promise if the loop function resolved), or re-run the loop, in which the modules get uncached and required again, with the loop function being called with the modules as arguments.

Returns a Promise, which rejects or resolves however the loop function rejects or resolves on its last run.
