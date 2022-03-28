const {expect, file} = require( '../../testFramework');
file('typing/properties');

expect([{b: 'Str'}, {b: 'hi'}], `
	let myType = { b: Str };
    let a: myType = { b: 'hi' };
`);

expect('TypeError', `
	let myType = { b: Str };
    let a: myType = { b: nil };
`);

expect(['<Func>', 'hello'], `
	let myFunc = func (g: {c: [Str, Str]}): {a: {b: Str}} {
		return {
			a: {
				b: g.c[0]
			}
		};
	};
	
	myFunc({c: ['hello', 'world']}).a.b;

`);