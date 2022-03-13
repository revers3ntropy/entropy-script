const {expect, file} = require( '../../testFramework');
file('typing/number');

expect([1.2], 'Number(1.2)');