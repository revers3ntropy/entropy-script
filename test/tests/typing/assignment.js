const {expect, file} = require( '../../testFramework');
file('typing/assignment');

expect([10, 10], `
    let a: number = 10;
    a;
`);
expect('TypeError', `
    let a: number = 'hi';
`);
expect('TypeError', `
    let a: number = 1;
    a = 'hi';
`);
expect(['myClass', {}, {}], `
    let myClass = class {};
    let a = myClass();
    let b: myClass = a;
`);
expect('TypeError', `
    let myClass = class {};
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