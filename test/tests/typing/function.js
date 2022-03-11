const {expect, file} = require( '../../testFramework');
file('typing/function');

expect(['<Func>', 'hi'], `
    let myFunc: (func () string) = func (): string 'hi';
    myFunc();
`);

expect('TypeError', `
    let myFunc: (func () string) = func (): number 1;
    myFunc();
`);