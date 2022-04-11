const {expect, file} = require( '../../testFramework');
file('basic/assignment');

expect(['aa', 'bb', true, false, false], `
let a = 'aa';
let b = 'bb';
let var res = true;
if a == 'aa' && b != 'cc' {    
    res = false; 
}
res;
`);


// maths assign
expect([1, 2], `
    let var n = 1;
    n += 1;
`);
expect([1, 6, 6, 6], `
    let x = 1;
    (x + 2)(x + 1);
    3(2);
    3(x + 1);
`);
expect([1, 50], `
    let var n = 1;
    n *= 50;
`);
expect([6, 2], `
    let var n = 6;
    n /= 3;
`);
expect(['hello', 'hello world'], `
    let var n = 'hello';
    n += ' world';
`);

expect(['a', 'b'], `
    let global a = 'a';
    let global b = 'b';
`);
expect('TypeError', `
    let global a = 'hi';
    a = 1;
`);
expect('TypeError', `
    let a = 'hi';
    a = 1;
`);
expect('InvalidSyntaxError', `
    var a = 'hi';
    let a = 1;
`);
expect('InvalidSyntaxError', `
    let a += 1;
`);

expect('InvalidSyntaxError', `
    let a = 1;
    let a = 2;
`);