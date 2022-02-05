import {Test} from "./testFramework.js";
import './tests.js';

import * as es from "../build/index.js";
import https from "https";
import http from "http";
import fs from "fs";
import * as sql from "sync-mysql";
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
	await es.init(
		console.log,
		async (msg, cb) =>
			cb(await askQuestion(msg).catch(console.log)),
		true, {
			https,
			http,
			fs,
			mysql: sql,
			print: console.log,
			fetch: {}
		}
	);
	console.log(Test.testAll().str());
})()
