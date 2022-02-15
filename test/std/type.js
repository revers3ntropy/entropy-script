import {expect} from '../testFramework.js';

expect(['Number'], 'type(1.1)');
expect(['Type'], 'type(type)');
expect(['Type'], 'type(number)');
expect([undefined], 'type()');
expect(['Function'], 'type(parseNum)');
expect(['String'], 'type("hi")');
expect(['Object'], 'type({a: 3})');
expect(['Array'], 'type([1, 2, 3])');