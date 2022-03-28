const {expect, file} = require( '../../testFramework');
file('typing/function');

expect(['<Func>', 'hi'], `
    let myFunc: (func () Str) = func (): Str 'hi';
    myFunc();
`);

expect('TypeError', `
    let myFunc: (func () Str) = func () 'hi';
    myFunc();
`);

expect('TypeError', `
    let myFunc: (func () Str) = func () 1;
    myFunc();
`);

expect('TypeError', `
    let myFunc: (func () Str) = func (): Num 1;
    myFunc();
`);