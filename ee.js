/**
 * Entropy Engine for Node.js
 *
 * Syntax:
 *
 * >> node ee.js ./path/to/script.es
 * will run a .es script
 *
 * >> node ee.js
 * will start the terminal
 */

import * as es from './build/index.js';
import readline from 'readline';
import {Test} from "./build/testFramework.js";
import './build/tests.js';
import {str} from "./build/util.js";
import {builtInFunctions} from "./build/builtInFunctions.js";

/**
 * Syntax: String(await askQuestion(query). Waits for Node I/O and when the user inputs something from the command line returns the line.
 * @param query
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
 * Initialise
 * @return {Promise<void>}
 */
async function init () {
	es.init(
		console.log,
		async (msg, cb) => cb(await askQuestion(msg)),
		['./std.es']
	);
}

/**
 * Runs a .es script
 * @param {string} path
 */
function runScript (path) {
	builtInFunctions['import'](path);
}

/**
 * Starts the terminal
 * @return {Promise<void>}
 */
async function runTerminal () {
	const input = String(await askQuestion('>>> '));
	if (input === 'exit') return;

	else if (input === 'test') {
		const res = await Test.testAll();
		console.log(res.str());
		runTerminal();
		return;

	} else if (/run [\w_\/.]+\.es/.test(input)) {
		runScript(input.substring(4));
		// run breaks out of the loop, to allow inputs
		return;
	} else if (/run [\w_\/.]+/.test(input)) {
		runScript(input.substring(4) + '.es');
		// run breaks out of the loop, to allow inputs
		return;
	}

	let res = es.run(input);

	let out = res.val;

	if (out === undefined) out = '--undefined--';
	if (out.length === 0)  out = '';
	if (out.length === 1)  out = out[0];
	if (res.error)         out = res.error.str;
	if (out !== undefined) console.log(str(out));

	runTerminal();
}

init();

if (process.argv.length === 2)
	runTerminal();
else
	runScript(process.argv[2]);
