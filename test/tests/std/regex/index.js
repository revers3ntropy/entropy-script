const {expect, file} = require( '../../../testFramework');
file('std/regex/index');


expect(['<Func>', {}], `
	let regex = import('regex');
	
	regex('hi');
`);