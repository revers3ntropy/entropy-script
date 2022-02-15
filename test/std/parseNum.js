import {expect} from '../testFramework.js';

expect([1], 'parseNum("1")');
expect([1.1], 'parseNum("1.1")');
expect([1.1], 'parseNum(1.1)');