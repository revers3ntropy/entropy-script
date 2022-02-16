import {expect, file} from '../testFramework.js';
file('basic/comments');

expect([], '// hiii');
expect([1], '// hiii \n 1');
expect([2], '1 + // hiii \n 1');