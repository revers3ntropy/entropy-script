const {expect, file} = require( '../../testFramework');
file('typing/parameters');

expect([{b: 'String'}, {b: 'hi'}], `
	let myType = { b: string };
    let a: myType = { b: 'hi' };
`);

expect('TypeError', `
	let myType = { b: string };
    let a: myType = { b: nil };
`);

expect(['<Func>', 'hello'], `
	let myFunc = func (g: {c: [string, string]}): {a: {b: string}} {
		return {
			a: {
				b: g.c[0]
			}
		};
	};
	
	myFunc({c: ['hello', 'world']});

`);