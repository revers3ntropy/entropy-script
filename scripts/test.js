const {Test} = require('../test/testFramework.js');

// libs for ES
const es = require("../build/latest.js");
const https = require('https');
const http = require('http');
const fs = require('fs');
const sql = require('sync-mysql');
const readline = require('readline');
const path = require('path');

const VERBOSE = process.argv.indexOf('-v') !== -1;

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
			// ../ as it is being run from the dir above, but imports are relative to this file
			await import(path.join('../', file));
		}
	}
}

(async () => {

	await importAll();

	const err = await es.init({
		print: (...args) => console.log('LOG: ', ...args),
		input: async (msg, cb) =>
			cb(await askQuestion(msg).catch(console.log)),
		libs: {
			https: [https, true],
			http: [http, true],
			fs: [fs, true],
			mysql: [sql, true],
			path: [path, true]
		}
	});

	if (err instanceof es.Error) {
		console.log('ERROR RUNNING TESTS:');
		console.log(err);
		return;
	}

	console.log(Test.testAll().str(VERBOSE));
})();

