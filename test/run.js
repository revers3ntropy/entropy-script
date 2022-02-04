import {Test} from "./testFramework.js";

import './tests.js';
import {init} from "../build/index.js";
import {runningInNode} from "../build/constants.js";

function main () {
	runningInNode();
	init();
	console.log(Test.testAll().str());
}

main();