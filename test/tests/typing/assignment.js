const {expect, file} = require( '../../testFramework');
file('typing/assignment');

expect([10, 10], `
    let a: number = 10;
    a;
`);
expect('TypeError', `
    const a: number = 'hi';
`);
expect(['<Type: myClass>', {}, {}], `
    const myClass = class {};
    let a = myClass();
    let b: myClass = a;
`);
expect('TypeError', `
    const myClass = class {};
    let b: myClass = 1;
`);
expect('TypeError', `
    let b: string = func () 0;
`);
expect('TypeError', `
    let b: number = ['hi'];
`);
expect('TypeError', `
    let b: string = nil;
`);