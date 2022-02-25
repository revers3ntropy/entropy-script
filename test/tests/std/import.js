const {expect, file} = require( '../../testFramework');
file('std/import');


expect([{otherLib: '<Symbol: otherLib>', doThing: '<Symbol: doThing>'}, '<Func>', 'hello world'], `
	const lib = import('./imports/lib/main.es');
	
	const main = func () {
		return lib.doThing();
	};
	
	main();
`);

expect('ImportError', `
	import('./this/path/does/not/exist.es');
`);