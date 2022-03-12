const {expect, file} = require( '../../testFramework');
file('std/parse_num');


expect([1], 'parse_num("1")');
expect([1.1], 'parse_num("1.1")');
expect([1.1], 'parse_num(1.1)');