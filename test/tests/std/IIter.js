const {expect, file} = require( '../../testFramework');
file('std/IIter');

expect([[], {}, 1, ''], `
	let a: IIterable = [];
	let b: IIterable = {};
	let c: IIterable = 1;
	let d: IIterable = '';
	let e: IIterable = namespace {};
`);

expect('TypeError', `
	let a: IIterable = nil;
`);
expect('TypeError', `
	let a: IIterable = func () {};
`);
expect('TypeError', `
	let a: IIterable = Str;
`);
expect('TypeError', `
	let a: IIterable = 1 | 2;
`);
expect('TypeError', `
	let a: IIterable = Error();
`);
expect('TypeError', `
	let a: IIterable = true;
`);