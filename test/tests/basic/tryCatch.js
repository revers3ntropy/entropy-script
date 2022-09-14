const {expect, file} = require( '../../testFramework');
file('basic/tryCatch');

expect([undefined], `
    try {
    	1;
    } catch {
    	2;
    }
`);
expect([undefined], `
    try {
    	throw();
    } catch {
    	2;
    }
`);
expect([0, undefined, 2], `
	let var a = 0;
    try {
    	throw();
    	a = 3;
    } catch {
    	a = 2;
    }
    a;
`);
expect([undefined, undefined, 'CustomError - custom error details'], `
	let var a;
    try {
    	throw('CustomError', 'custom error details');
    	a = 'no';
    } catch {
    	a = err.name + ' - ' + err.details;
    }
    a;
`);

expect([undefined, undefined, 'HelloWorld'], `
	let var a;
    try {
    	throw('Hello');
    	a = 'no';
    } catch {
    	a = err.name;
    	try {
            throw('World');
            a += 'no';
        } catch {
            a += err.name;
        }
    }
    a;
`);