var _ = require('lodash'),
	exec = require('child_process').exec,
	fs = require('fs'),
	path = require('path'),
	Q = require('q'),
	util = require('util'),

	writeFile = Q.nfbind(fs.writeFile),
	unlink = Q.nfbind(fs.unlink),

	CLI_SPY = '__cli-spy__',
	SPY_PLACEHOLDER = '/*__spy__*/',
	ARGS_STR_REGEX = /__spy__(.*)__spy__/,
	ARGS_SPY = 'process.stdout.write(\'__spy__\' + JSON.stringify(Array.prototype.slice.call(arguments)) + \'__spy__\\n\');',
	STUB_CLI_TEMPLATE = '#!/usr/bin/env node\n(%s());\n\nrequire(\'%s\');',

	CLI_SPY_OPTS = {
		encoding: 'utf8',
		mode: 0755
	};

function setup(stubCli, cwd) {
	return writeFile(path.join(cwd, CLI_SPY), stubCli, CLI_SPY_OPTS);
}

function tearDown(cwd) {
	return unlink(path.join(cwd, CLI_SPY));
}

function execCli(argStr, options) {
	var deferred = Q.defer();

	exec(path.join(options.cwd, CLI_SPY) + ' ' + argStr, options, function(err, stdout, stderr) {
		if (err) {
			return deferred.reject(err);
		}

		try {
			var spiedArgStr = stdout.match(ARGS_STR_REGEX)[1];
			deferred.resolve({
				stdout: stdout,
				stderr: stderr,
				args: JSON.parse(spiedArgStr)
			});
		} catch(e) {
			deferred.reject(e);
		}
	});

	return deferred.promise;
}

function cliSpy(cli, stubFn) {
	var stubCli = util.format(STUB_CLI_TEMPLATE, stubFn.toString(), cli).replace(SPY_PLACEHOLDER, ARGS_SPY);

	return {
		exec: function(argStr, opts, callback) {
			if (typeof opts === 'function') {
				callback = opts;
				opts = null;
			}

			var options = opts && _.clone(opts) || {};

			options.cwd = options.cwd || process.cwd();

			return setup(stubCli, options.cwd)
				.then(function() {
					return execCli(argStr, options);
				})
				.finally(function() {
					return tearDown(options.cwd);
				})
				.nodeify(callback);
		}
	};
}

exports = module.exports = cliSpy;
