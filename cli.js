/*
	Entropy Script for Node.js

	Syntax:

		$ node cli ./path/to/script.es

	will run a script

		$ node cli

	will start the REPL
 */

// node libs that scripts should have access to
const https = require('https');
const http = require('http');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

/** @type module:entropy-script */
const es = require('./build/latest');

/**
 * Syntax: await askQuestion(query).
 * Waits for Node I/O and when the user inputs something from the command line returns the line.
 * @param {string} query
 * @return {Promise<string>}
 */
function askQuestion(query) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	return new Promise(resolve => rl.question(query, ans => {
		rl.close();
		resolve(ans);
	}));
}

/**
 * @return {Promise<void>}
 */
async function init () {
	let fetch = await import('node-fetch');

	let err = await es.init({
		print: console.log,
		input: async (msg, cb) => cb(await askQuestion(msg).catch(console.log)),
		libs: {
			https: [https, true],
			http: [http, true],
			fs: [fs, true],
			path: [path, true],
			'node-fetch': [fetch, true]
		}
	});

	if (err instanceof es.Error) {
		console.log(err.str);
	}

	if (fs.existsSync(es.configFileName)) {
		es.parseConfig(JSON.parse(fs.readFileSync(es.configFileName).toString()));
	}
}

function dealWithFlags (args) {

}

/**
 * Runs a .es script
 * @param {string[]} args
 */
function runScript (args) {

	let file = args[args.length-1];

	if (file.substring(file.length-3) !== '.es') {
		file = file + '.es';
	}

	dealWithFlags(args.slice(0, -1));

	if (!fs.existsSync(file)) {
		console.log(new es.ImportError(
			new es.Position(0, 0, 0, 'JSES-CLI'),
			file,
			`Can't resolve file '${file}'`
		).str);
		return;
	}

	const wrappedArgv = new es.ESArray(process.argv.map(s => new es.ESString(s)));

	const env = new es.Context();
	env.parent = es.global;
	env.setOwn('args', wrappedArgv, {
		isConstant: true
	});

	let res = es.run(fs.readFileSync(file, 'utf-8').toString(), {
		env,
		fileName: file,
		currentDir: path.dirname(file)
	});
	if (res.error) {
		console.log(res.error.str);
	}
}

/**
 * Starts the terminal
 * @return {Promise<void>}
 */
async function runTerminal () {
	let input = String(await askQuestion('>>> '));

	if (input === 'exit') {
		return;
	}

	if (input === 'help') {
		// assume that the user wants help, so make it run the 'help' function with the NoParam option,
		// so it displays the default welcome help message
		input = 'help(*NoParam=1)';
	}

	let res = es.run(input, {
		fileName: 'JSES-REPL'
	});

	if (res.error) {
		console.log(res.error.str);
		runTerminal();
		return;
	}

	let out = res.val?.__value__;

	if (out === undefined) {
		console.log( '--undefined--');
		runTerminal();
		return;
	}

	for (let item of out) {
		console.log(es.str(item));
	}

	runTerminal();
}

function welcomeMessage () {
	console.log('Welcome to JS EntropyScript v' + es.VERSION);
	console.log(`(Node ${process.versions.node}, V8 engine ${process.versions.v8})`);
	console.log("Type 'exit' to exit, 'help' for more information");
}

async function main () {
	await init();

	if (process.argv.length === 2) {
		welcomeMessage();
		return runTerminal();
	}

	runScript(process.argv.slice(2));
}

main();