const {expect, file} = require( '../../testFramework');
file('basic/assignment');

expect(['aa', 'bb', true, undefined, false], `
let a = 'aa';
let b = 'bb';
let res = true;
if a == 'aa' && b != 'cc' {    
    res = false; 
}
res;
`);


// maths assign
expect([1, 2], `
    var n = 1;
    n += 1;
`);
expect([1, 50], `
    var n = 1;
    n *= 50;
`);
expect([6, 2], `
    var n = 6;
    n /= 3;
`);
expect(['hello', 'hello world'], `
    var n = 'hello';
    n += ' world';
`);

expect(['hi'], `
    let global const a = 'hi';
`);
expect('TypeError', `
    var global const a = 'hi';
    a = 1;
`);
expect('TypeError', `
    var local const a = 'hi';
    a = 1;
`);
expect('InvalidSyntaxError', `
    var local mutable a = 'hi';
    let a = 1;
`);
expect('InvalidSyntaxError', `
    let a += 1;
`);

expect('InvalidSyntaxError', `
    let a = 1;
    let a = 2;
`);