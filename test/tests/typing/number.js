const {expect, file} = require( '../../testFramework');
file('typing/number');

expect([1.2], 'number(1.2)');