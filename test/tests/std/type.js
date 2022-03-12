const {expect, file} = require( '../../testFramework');
file('std/type');


expect(['Number'], 'type(1.1)');
expect(['Type'], 'type(type)');
expect(['Type'], 'type(number)');
expect([undefined], 'type()');
expect(['Function'], 'type(parse_num)');
expect(['String'], 'type("hi")');
expect(['Object'], 'type({a: 3})');
expect(['Array'], 'type([1, 2, 3])');