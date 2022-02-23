import {Test} from './testFramework.js';

// libs for ES
import * as es from "../build/index.js";
import https from "https";
import http from "http";
import fs from "fs";
import * as sql from "sync-mysql";
import * as path from 'path';
import readline from "readline";

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));


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

async function importAll (dir='./test/tests') {
	const files = fs.readdirSync(dir);
	for (let f of files) {

		const file = path.join(dir, f);

		if (file.substr(file.length-3, file.length) !== '.js') {
			await importAll(file);
		} else {
			await import(file);
		}
	}
}

(async () => {

	await importAll();

	const err = await es.init(
		console.log,
		async (msg, cb) =>
			cb(await askQuestion(msg).catch(console.log)),
		true, {
			https,
			http,
			fs,
			mysql: sql,
			print: console.log,
			fetch: {},
			path
		},
	);

	if (err) {
		console.log(err);
	}

	console.log(Test.testAll().str());
})();

