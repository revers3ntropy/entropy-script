const {expect, file} = require( '../../testFramework');
file('std/delete');


expect('ReferenceError', `
	let a = 0;
	delete('a');
	a;
`);
expect('ReferenceError', `
	let a = 0;
	func f () delete('a');
	f();
	a;
`);

expect([0, '<Func>', undefined, 0], `
	let a = 0;
	func f () {
	    let a = 0;
        delete('a');
    };
	f();
	a;
`);
