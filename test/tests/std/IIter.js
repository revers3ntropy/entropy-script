const {expect, file} = require( '../../testFramework');
file('std/IIter');


expect([[]], `
	let a: IIter = [];
`);