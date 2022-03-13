const {expect, file} = require( '../../testFramework');
file('typing/intersection');

expect([{a: '', b: 0}], `
    var b: ({a: String, b: Any} & (~{b: String})) = {a: '', b: 0};
`);
expect([{a: '', b: 0}], `
    var b: ({a: String, b: Any & (~String)}) = {a: '', b: 0};
`);

expect('TypeError', `
    var b: ({a: String} & (~{b: String})) = {a: '', b: 0};
`);
expect('TypeError', `
    var b: (~{b: Number, a: String}) = {a: '', b: 0};
`);
expect('TypeError', `
	var b: ({a: String} & {b: Number}) = {a: ''};
`);
expect('TypeError', `
	var b: ({a: String} & {b: Number}) = {b: 0};
`);
expect('TypeError', `
	var b: ({a: String} & {b: Number}) = {a: 0, b: 0};
`);
expect('TypeError', `
	var b: ({a: String} & {b: Number}) = {};
`);
expect('TypeError', `
	var b: ({a: String} & {b: Number}) = {a: '', b: 0, c: 0};
`);