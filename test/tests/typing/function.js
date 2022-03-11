const {expect, file} = require( '../../testFramework');
file('typing/function');

expect(['<Func>', 'hi'], `
    let myFunc: (func () string) = func () 'hi';
    myFunc();
`);