const {expect, file} = require( '../../testFramework');
file('std/type');


expect('1.1', 'throw(1.1)');
expect('MyCustomError', `throw('MyCustomError', 'some description')`);
expect('TypeError', `throw(TypeError())`);