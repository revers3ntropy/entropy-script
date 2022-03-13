const {expect, file} = require( '../../testFramework');
file('typing/properties');

expect([{b: 'String'}, {b: 'hi'}], `
	let myType = { b: String };
    let a: myType = { b: 'hi' };
`);

expect('TypeError', `
	let myType = { b: String };
    let a: myType = { b: nil };
`);

expect(['<Func>', 'hello'], `
	let myFunc = func (g: {c: [String, String]}): {a: {b: String}} {
		return {
			a: {
				b: g.c[0]
			}
		};
	};
	
	myFunc({c: ['hello', 'world']}).a.b;

`);