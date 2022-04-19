const {expect, file} = require( '../../testFramework');
file('std/IIter');

expect([[], {}, '', {}, [0, 1, 2]], `
	let a: IIterable = [];
	let b: IIterable = {};
	let c: IIterable = '';
	let d: IIterable = namespace {};
	let e: IIterable = range(3);
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
	let a: IIterable = 1;
`);
expect('TypeError', `
	let a: IIterable = Error();
`);
expect('TypeError', `
	let a: IIterable = true;
`);