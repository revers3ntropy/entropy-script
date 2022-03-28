const {expect, file} = require( '../../testFramework');
file('typing/tuple');

expect([['hi']], `
    let a: ([Str]) = ['hi'];
`);

expect('TypeError', `
    let b: ([Str]) = ['hi', 1];
`);

expect('TypeError', `
    let c: ([Str]) = [11];
`);