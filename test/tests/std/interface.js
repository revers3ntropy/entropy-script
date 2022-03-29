const {expect, file} = require( '../../testFramework');
file('std/interface');

expect([{}], `
	interface({});
`);

expect([{a: 'Num'}], `
	interface({
		a: Num
	});
`);

expect([{a: 'Num'}, {a: 1}], `
	let Ia = interface({
		a: Num
	});
	
	let b: Ia = {a: 1};
`);

expect('TypeError', `
	let Ia = interface({
		a: Num
	});
	
	let b: Ia = {a: nil};
`);

expect([{a: 'Num'}, {b: 'Str'}, {a: 1, b: ''}], `
	let Ia = interface({
		a: Num
	});
	let Ib = interface({
		b: Str
	});
	
	let b: (Ia & Ib) = {
		a: 1, 
		b: ''
	};
`);

expect([{a: 'Num'}, {b: 'Str'}, {a: 1, b: '', c: undefined, d: 'Str'}], `
	let Ia = interface({
		a: Num
	});
	let Ib = interface({
		b: Str
	});
	
	let b: (Ia & Ib) = {
		a: 1, 
		b: '',
		c: nil,
		d: Str
	};
`);

expect('TypeError', `
	let Ia = interface({
		a: Num
	});
	let Ib = interface({
		b: Str
	});
	
	let b: (Ia & Ib) = {};
`);
