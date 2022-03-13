const {expect, file} = require( '../../testFramework');
file('typing/function');

expect(['<Func>', 'hi'], `
    let myFunc: (func () String) = func (): String 'hi';
    myFunc();
`);

expect('TypeError', `
    let myFunc: (func () String) = func () 'hi';
    myFunc();
`);

expect('TypeError', `
    let myFunc: (func () String) = func () 1;
    myFunc();
`);

expect('TypeError', `
    let myFunc: (func () String) = func (): Number 1;
    myFunc();
`);