import {Test} from './testFramework.js';

// import all tests
import './basic/general.js';
import './basic/arrays.js';
import './basic/assignment.js';
import './basic/classes.js';
import './basic/comments.js';
import './basic/functions.js';
import './basic/if.js';
import './basic/loops.js';
import './basic/namespaces.js';
import './basic/objects.js';
import './basic/operatorOverride.js';

import './typing/assignment.js';
import './typing/custom.js';
import './typing/parameters.js';
import './typing/returns.js';

import './examples/vector.js';

import './std/array.js';
import './std/import.js';
import './std/parseNum.js';
import './std/range.js';
import './std/string.js';
import './std/type.js';
import './std/using.js';

import './std/primitive/bool.js';
import './std/primitive/cast.js';
import './std/primitive/clone.js';
import './std/primitive/isa.js';
import './std/primitive/is.js';
import './std/primitive/str.js';

import './std/type/__instances__.js';

// libs for ES
import * as es from "../build/index.js";
import https from "https";
import http from "http";
import fs from "fs";
import * as sql from "sync-mysql";
import * as path from 'path';
import readline from "readline";



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

(async () => {

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

