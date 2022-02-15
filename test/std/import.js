import {expect} from '../testFramework.js';

expect([{otherLib: '<Symbol: otherLib>', doThing: '<Symbol: doThing>'}, '<Func: main>', 'hello world'], `
	const lib = import('./examples/imports/lib/main.es');
	
	const main = func () {
		return lib.doThing();
	};
	
	main();
`);

expect('ImportError', `
	import('./this/path/does/not/exist.es');
`);