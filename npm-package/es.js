/**
 * Entropy Script for Node.js
 *
 * Syntax:
 *
 * >> node es.js ./path/to/script.es
 * will run a script
 *
 * >> node es.js
 * will start the terminal
 */

// node libs that scripts should have access to
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as sql from 'sync-mysql';
import readline from 'readline';
import * as dotenv from 'dotenv';
dotenv.config();

import {refreshPerformanceNow, runningInNode} from "./build/constants.js";
runningInNode();
await refreshPerformanceNow(true);

import * as es from './build/index.js';
import {Test} from "./build/testFramework.js";
import './build/tests.js';
import {str} from "./build/util.js";
import {builtInFunctions} from "./build/builtInFunctions.js";
import addNodeLibs from "./build/nodeLibs.js";
import {ESString} from "./build/primitiveTypes.js";

/**
 * Syntax: String(await askQuestion(query).
 * Waits for Node I/O and when the user inputs something from the command line returns the line.
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
export async function init () {
	es.init(
		console.log,
		async (msg, cb) => cb(await askQuestion(msg).catch(console.log)),
		[]
	);

	addNodeLibs(https, http, fs, sql);
}

/**
 * Runs a .es script
 * @param {string} path
 */
export function runScript (path) {
	builtInFunctions['import'](new ESString(path));
}

/**
 * @param {any} r
 */
function handlePromiseError (r) {
	console.log(`Error in promise: \n${r}`);
}

/**
 * Starts the terminal
 * @return {Promise<void>}
 */
export async function runTerminal () {
	const input = String(await askQuestion('>>> '));
	if (input === 'exit') return;

	else if (input === 'test') {
		const res = await Test.testAll();
		console.log(res.str());
		runTerminal().catch(handlePromiseError);
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

	let out = res.val?.valueOf();

	if (res.val === undefined) out = '--undefined--';
	else if (out.length === 0) out = '';
	else if (out.length === 1) out = out[0];
	if (res.error)             out = res.error.str;
	if (out !== undefined)
		// final out
		console.log(str(out));

	runTerminal();
}

export async function main () {
	await init().catch(handlePromiseError);

	if (process.argv.length === 2)
		runTerminal();
	else
		runScript(process.argv[2]);
}

main();