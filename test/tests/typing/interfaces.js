const {expect, file} = require( '../../testFramework');
file('typing/interfaces');

expect([], `
    interface I {
    	a: func () nil,
    	b: Number
    };
`);

expect([], `
    let I = interface {
    	a: func () nil,
    	b: Number
    };
`);