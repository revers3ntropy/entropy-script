const {expect, file} = require( '../../testFramework');
file('typing/intersection');

expect([{a: '', b: 0}], `
    let b: ({a: Str, b: Any} & (~{b: Str})) = {a: '', b: 0};
`);
expect([{a: '', b: 0}], `
    let b: ({a: Str, b: Any & (~Str)}) = {a: '', b: 0};
`);

expect('TypeError', `
    let b: ({a: Str} & (~{b: Str})) = {a: '', b: 0};
`);
expect('TypeError', `
    let b: (~{b: Num, a: Str}) = {a: '', b: 0};
`);
expect('TypeError', `
	let b: ({a: Str} & {b: Num}) = {a: ''};
`);
expect('TypeError', `
	let b: ({a: Str} & {b: Num}) = {b: 0};
`);
expect('TypeError', `
	let b: ({a: Str} & {b: Num}) = {a: 0, b: 0};
`);
expect('TypeError', `
	let b: ({a: Str} & {b: Num}) = {};
`);
expect('TypeError', `
	let b: ({a: Str} & {b: Num}) = {a: '', b: 0, c: 0};
`);