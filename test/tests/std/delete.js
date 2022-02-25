import {expect, file} from '../../testFramework';
file('std/delete');

/*
expect('ReferenceError', `
	const a = 0;
	delete(a);
	a;
`);
expect('ReferenceError', `
	const a = 0;
	const f = func () delete(a);
	f();
	a;
`);

expect([0, '<Func>', undefined, 0], `
	const a = 0;
	const f = func () {
	    let a = 0;
        delete(a);
    };
	f();
	a;
`);
 */