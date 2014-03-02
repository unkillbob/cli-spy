cli-spy
=======

[![Build Status](https://travis-ci.org/unkillbob/cli-spy.png?branch=master)](https://travis-ci.org/unkillbob/cli-spy)

Helper utility for testing isolated cli modules.

Usage
=====

Example usage (using [mocha](http://visionmedia.github.io/mocha/)) assuming the following application structure:

- a main module in `./lib/index.js` with an `init()` method
- a cli module in `./lib/cli.js` whose sole purpose is to init the main module with the parsed args
- tests in `./test/` but being run from the root application directory

```js
var cliSpy = require('cli-spy');

function stubIndexFn() {
    // Stub the index module, injecting the spy so it can report the args passed to init:
    require('./lib/index').init = function() {
        // The following placeholder is required:
        /*__spy__*/
    };
}

describe('My CLI', function() {
    var myCli = cliSpy('./lib/cli', stubIndexFn);

    it('parses some args', function() {
        var spy = myCli.exec('--some args -g -o --here', function(result) {
            var stdout = result.stdout,
                stderr = result.stderr,

                // JSON representation of the `arguments` to `index.init()`
                args = result.args;
        });
    });
});
```


API
===

```js
var cliSpy = require('cli-spy');
```

## cliSpy(pathToCli, stubIndexFn)

Initialises a spy for the given CLI module.

- **pathToCli** {String} path (from the `cwd`) to the CLI module to spy on.
- **stubIndexFn** {Function} stub implementation of the application's main module. Must include the following placeholder: `/*__spy__*/`.

Returns a spy for the given CLI module.

## spy.exec(argsStr, [options], [callback])

Executes the CLI with the given arguments and reports the parsed arguments passed to the stub main function.

- **argsStr** {String} the string of arguments to execute the CLI with.
- **options** {Object} (optional) additional options to pass to [`child_process.exec`](http://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback). *Note:* if you specify a different `cwd`, ensure the **pathToCli** the spy was initialised with is relative to that `cwd`.
- **callback** {Function} (optional) called back with the result of executing the CLI, unnecessary if using the returned promise.

Returns a [Q promise](https://github.com/kriskowal/q) that is resolved with the result of executing the CLI.

The result of executing the CLI (either resolved via promise or returned via callback) includes:

- **stdout** any output sent to `stdout` by the CLI. *Note:* this will also include the serialised arguments printed by the spy.
- **stderr** any output sent to `stderr` by the CLI.
- **args** JSON representation of the `arguments` passed to the stub main function.

# Note on Windows Support

Currently this doesn't work on Windows, see [#1](https://github.com/unkillbob/cli-spy/issues/1).
