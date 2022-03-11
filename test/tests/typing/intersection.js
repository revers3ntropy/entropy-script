const {expect, file} = require( '../../testFramework');
file('typing/intersection');

expect([{a: '', b: 0}], `
    var b: ({a: string, b: any} & (~{b: string})) = {a: '', b: 0};
`);
expect([{a: '', b: 0}], `
    var b: ({a: string, b: any & (~string)}) = {a: '', b: 0};
`);

expect('TypeError', `
    var b: ({a: string} & (~{b: string})) = {a: '', b: 0};
`);
expect('TypeError', `
    var b: (~{b: number, a: string}) = {a: '', b: 0};
`);
expect('TypeError', `
	var b: ({a: string} & {b: number}) = {a: ''};
`);
expect('TypeError', `
	var b: ({a: string} & {b: number}) = {b: 0};
`);
expect('TypeError', `
	var b: ({a: string} & {b: number}) = {a: 0, b: 0};
`);
expect('TypeError', `
	var b: ({a: string} & {b: number}) = {};
`);
expect('TypeError', `
	var b: ({a: string} & {b: number}) = {a: '', b: 0, c: 0};
`);