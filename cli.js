/**
 * Entropy Script for Node.js
 *
 * Syntax:
 *
 * >> node cli.js ./path/to/script.es
 * will run a script
 *
 * >> node cli.js
 * will start the terminal
 */

// node libs that scripts should have access to
const https = require('https');
const http = require('http');
const fs = require('fs');
const sql = require('sync-mysql');
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
	let err = await es.init({
		print: console.log,
		input: async (msg, cb) => cb(await askQuestion(msg).catch(console.log)),
		libs: {
			https: [https, true],
			http: [http, true],
			fs: [fs, true],
			mysql: [sql, true],
			path: [path, true]
		}
	});

	if (err) {
		console.log(err.str);
	}

	if (fs.existsSync(es.configFileName)) {
		es.parseConfig(JSON.parse(fs.readFileSync(es.configFileName).toString()));
	}
}

/**
 * Runs a .es script
 * @param {string} file
 */
function runScript (file) {

	if (file.substring(file.length-3) !== '.es') {
		file = file + '.es';
	}

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
	const input = String(await askQuestion('>>> '));

	if (input === 'exit') {
		return;
	}

	let res = es.run(input, {
		fileName: 'JSES-REPL'
	});

	let out = res.val?.valueOf();

	if (out === undefined) {
		out = '--undefined--';
	} else if (out.length === 0) {
		runTerminal();
		return;
	} else if (out.length === 1) {
		out = out[0];
	}
	if (res.error) {
		out = res.error.str;
	}
	if (out !== undefined) {
		// final out
		console.log(es.str(out));
	}

	runTerminal();
}

async function compile (path, outPath) {
	let {compileToJavaScript, compileToPython, error: parseErr} = es.parse(fs.readFileSync(path).toString());
	if (parseErr) {
		console.log(parseErr.str);
		return;
	}

	const options = {
		minify: process.argv.indexOf('--minify') !== -1,
		indent: 0,
		symbols: []
	}

	let val, error;

	if (process.argv.indexOf('--python') !== -1) {
		const res = compileToPython(options);
		val = res.val;
		error = res.error;
	} else {
		const res = compileToJavaScript(options);
		val = res.val;
		error = res.error;
	}

	if (error) {
		console.log(error.str);
	}

	fs.writeFileSync(outPath, val);
}

async function main () {
	await init();

	const compileIdx = process.argv.indexOf('-compile');
	if (compileIdx !== -1) {
		compile(process.argv[compileIdx+1], process.argv[compileIdx+2]);
		return;
	}

	if (process.argv.length === 2) {
		runTerminal();
	} else {
		runScript(process.argv[2]);
	}
}

main();