import {expect, file} from '../testFramework.js';
file('basic/comments');

// single line
expect([], '// hiii');
expect([1], '// hiii \n 1');
expect([2], '1 + // hiii \n 1');

// multiline
expect([2], '1 + /* hiii */ 1');
expect([2], '1 + /* hiii \n\n*/ 1');
expect([2], `
	let /**
	 * @desc JSDoc style comment
	 */
	a = 2;
`);