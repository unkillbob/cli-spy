cli-spy
=======

[![Build Status](https://travis-ci.org/unkillbob/cli-spy.png?branch=master)](https://travis-ci.org/unkillbob/cli-spy)

Helper utility for testing isolated cli modules.

Usage
-----

Example usage (using [mocha](http://visionmedia.github.io/mocha/)) assuming the following application structure:

- a main module in `./lib/index.js` with an `init()` method
- a cli module in `./lib/cli.js` whose sole purpose is to init the main module with the parsed args
- tests in `./test/` but being run from the root application directory

```
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

Note on Windows Support
-----------------------

Currently this doesn't work on Windows, see [#1](https://github.com/unkillbob/cli-spy/issues/1).

