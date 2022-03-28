const {expect, file} = require( '../../testFramework');
file('typing/assignment');

expect([10, 10], `
    let a: Num = 10;
    a;
`);
expect('TypeError', `
    let a: Num = 'hi';
`);
expect('TypeError', `
    let a: Num = 1;
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
    let b: Str = func () 0;
`);
expect('TypeError', `
    let b: Num = ['hi'];
`);
expect('TypeError', `
    let b: Str = nil;
`);