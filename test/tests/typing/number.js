const {expect, file} = require( '../../testFramework');
file('typing/number');

expect([1.2], 'Num(1.2)');
expect([1.2], 'Num("1.2")');