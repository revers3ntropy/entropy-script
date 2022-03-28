const {expect, file} = require( '../../testFramework');
file('std/array');

expect([['1', '.', '2']], 'Arr(`1.2`)');
expect([['1', '.', '2', 0, 0, 1]], 'Arr(`1.2`, 1, 2)');
expect([[0, 1, 2]], 'Arr([0, 1, 2])');
expect([[]], 'Arr({})');