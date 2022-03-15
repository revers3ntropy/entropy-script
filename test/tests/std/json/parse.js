const {expect, file} = require( '../../../testFramework');
file('std/json/parse');

expect([{}], `import('json').parse('{}')`);
expect([undefined, {}], `
	using(import('json'));
	parse('{}');
`);