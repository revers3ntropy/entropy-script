const {expect, file} = require( '../../testFramework');
file('std/import');


expect([{otherLib: '<Symbol: otherLib>', doThing: '<Symbol: doThing>'}, '<Func>', 'hello world'], `
	let lib = import('./imports/lib/main.es');
	
	let main = func () {
		lib.doThing();
	};
	
	main();
`);

expect('ImportError', `
	import('./this/path/does/not/exist.es');
`);