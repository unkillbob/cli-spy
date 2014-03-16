var test = require('tap').test,
	fs = require('fs'),
	path = require('path'),

	cliSpy = require('../index'),

	stubCli = './test/stub-cli',
	noOp = function() {};

test('the tests are being run from the module directory', function(t) {
	t.notEqual(process.cwd(), __dirname, 'Please run the tests from the module directory (not the `test` directory)');
	t.end();
});

test('it exports a function', function(t) {
	t.type(cliSpy, 'function');
	t.end();
});

test('it expects a string and a function', function(t) {
	t.throws(function() {
		cliSpy();
	});
	t.end();
});

test('it returns an object with an `exec` function', function(t) {
	var spy = cliSpy(stubCli, noOp);
	t.type(spy, 'object');
	t.type(spy.exec, 'function');
	t.end();
});

test('`exec` returns a promise which is rejected if the stub function does not include the spy placeholder', function(t) {
	var spy = cliSpy(stubCli, noOp),
		promise = spy.exec(),
		catchCalled = false,
		finallyCalled = false;

	t.type(promise.then, 'function');
	t.type(promise.catch, 'function');
	t.type(promise.finally, 'function');

	setTimeout(function() {
		if (!finallyCalled) {
			t.ok(catchCalled, '`exec` promise catch not called');
			t.ok(finallyCalled, '`exec` promise finally not called');
			t.end();
		}
	}, 500);

	promise.catch(function() {
		catchCalled = true;
	}).finally(function() {
		finallyCalled = true;
		t.end();
	});
});

test('`exec` calls back with an error if the stub function does not include the spy placeholder', function(t) {
	var spy = cliSpy(stubCli, noOp),
		callbackCalled = false;

	setTimeout(function() {
		if (!callbackCalled) {
			t.ok(callbackCalled, '`exec` callback not called (as third argument to exec)');
			t.end();
		}
	}, 500);

	spy.exec('', {}, function(err) {
		callbackCalled = true;
		t.ok(err, 'callback should have been called with an error if spy placeholder missing');
		t.end();
	});
});

test('`exec` returns a promise which is rejected if the stub function does not include the spy placeholder', function(t) {
	var spy = cliSpy(stubCli, function() {
			var index = require('./test/stub-index');
			index.init = function() {};
			index.neverExecuted = function() {
				/*__spy__*/
			};
		}),
		promise = spy.exec(),
		catchCalled = false,
		finallyCalled = false;

	setTimeout(function() {
		if (!finallyCalled) {
			t.ok(catchCalled, '`exec` promise catch not called');
			t.ok(finallyCalled, '`exec` promise finally not called');
			t.end();
		}
	}, 500);

	spy.exec()
		.catch(function(err) {
			catchCalled = true;
			t.equal(err, 'CLI did not execute index module.');
		})
		.finally(function() {
			finallyCalled = true;
			t.end();
		});
});

test('callback can be second argument to `exec`', function(t) {
	var spy = cliSpy(stubCli, noOp),
		callbackCalled = false;

	setTimeout(function() {
		if (!callbackCalled) {
			t.ok(callbackCalled, '`exec` callback not called (as second argument to exec)');
			t.end();
		}
	}, 500);

	spy.exec('', function() {
		callbackCalled = true;
		t.end();
	});
});

test('`exec` fails if the process exits with an error', function(t) {
	var expectedError = 'test expected error',
		errorCaught = false,
		spy;

	spy = cliSpy(stubCli, function() {
		process.exit(1);
	});

	setTimeout(function() {
		if (!errorCaught) {
			t.ok(errorCaught, '`exec` should have failed on process.exit(1)');
			t.end();
		}
	}, 500);

	spy.exec()
		.catch(function(err) {
			errorCaught = true;
			t.ok(err);
			t.end();
		});
});

test('it cleans up after itself', function(t) {
	var spyBin = '__cli-spy__';

	fs.exists(spyBin, function(spyBinExists) {
		t.notOk(spyBinExists, 'spy bin file should not exist in cwd');

		fs.exists(path.join('test', spyBin), function(testSpyBinExists) {
			t.notOk(testSpyBinExists, 'spy bin file should not exist in test dir');
			t.end();
		});
	});
});

test('it reports the arguments passed to the stub function by the cli', function(t) {
	var spy = cliSpy(stubCli, function() {
			require('./test/stub-index').init = function() {
				/*__spy__*/
			};
		}),
		promiseResolved = false;

	setTimeout(function() {
		if (!promiseResolved) {
			t.ok(promiseResolved, '`exec` promise should have been resolved');
			t.end();
		}
	}, 500);

	spy.exec('')
		.then(function(result) {
			var args;

			promiseResolved = true;

			t.ok(result);
			t.type(result.stdout, 'string');
			t.type(result.stderr, 'string');
			t.type(result.executions, 'object');

			t.equal(result.executions.length, 1);

			args = result.executions[0].args;

			t.equal(args[0], 'foo');
			t.deepEqual(args[1], ['bar', 'baz']);
			t.deepEqual(args[2], {
				beep: 'boop',
				pirate: 'ninja',
				cwd: process.cwd()
			});

			// The first execution's arguments, for backwards compatibility
			t.type(result.args, 'object');
			t.deepEqual(result.args, args);

			t.end();
		}, function(err) {
			t.fail(err);
		});
});

test('it reports the arguments for each execution of the stub index by the cli', function(t) {
	var spy = cliSpy('./test/stub-cli-multi-exec', function() {
			require('./test/stub-index').init = function() {
				/*__spy__*/
			};
		}),
		promiseResolved = false;

	setTimeout(function() {
		if (!promiseResolved) {
			t.ok(promiseResolved, '`exec` promise should have been resolved');
			t.end();
		}
	}, 500);

	spy.exec('')
		.then(function(result) {
			var args;

			promiseResolved = true;
			t.ok(result);

			t.equal(result.executions.length, 2);

			args = result.executions[0].args;

			t.equal(args[0], 'foo');
			t.deepEqual(args[1], ['bar', 'baz']);

			// The first execution's arguments, for backwards compatibility
			t.type(result.args, 'object');
			t.deepEqual(result.args, args);

			args = result.executions[1].args;
			t.deepEqual(args[0], {
				beep: 'boop',
				pirate: 'ninja'
			});

			t.end();
		}, function(err) {
			t.fail(err);
		});
});

test('it supports multiple instances of the spy placeholder', function(t) {
	var spy = cliSpy('./test/stub-cli', function() {
			function neverExecuted() {
				/*__spy__*/
			}
			require('./test/stub-index').init = function() {
				/*__spy__*/
			};
		}),
		promiseResolved = false;

	setTimeout(function() {
		if (!promiseResolved) {
			t.ok(promiseResolved, '`exec` promise should have been resolved');
			t.end();
		}
	}, 500);

	spy.exec('')
		.then(function(result) {
			promiseResolved = true;

			t.ok(result);
			t.equal(result.executions.length, 1);

			t.end();
		}, function(err) {
			t.fail(err);
		});
});

test('it executes the spy in the given cwd', function(t) {
	var cwd = path.join(process.cwd(), 'test'),
		spy = cliSpy('./stub-cli', function() {
			require('./stub-index').init = function() {
				/*__spy__*/
			};
		}),
		promiseResolved = false;

	setTimeout(function() {
		if (!promiseResolved) {
			t.ok(promiseResolved, '`exec` promise should have been resolved');
			t.end();
		}
	}, 500);

	spy.exec('', { cwd: cwd })
		.then(function(result) {
			promiseResolved = true;
			t.equal(result.args[2].cwd, cwd);
			t.end();
		}, function(err) {
			t.fail(err);
		});
});
