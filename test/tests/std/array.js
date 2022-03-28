const {expect, file} = require( '../../testFramework');
file('std/array');

expect([['1', '.', '2']], 'Array(`1.2`)');
expect([['1', '.', '2', 0, 0, 1]], 'Array(`1.2`, 1, 2)');
expect([[0, 1, 2]], 'Array([0, 1, 2])');
expect([[]], 'Array({})');