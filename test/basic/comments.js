import {expect} from '../testFramework.js';

expect([], '');
expect([], '// hiii');
expect([1], '// hiii \n 1');
expect([2], '1 + // hiii \n 1');