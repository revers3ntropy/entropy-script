const {expect, file} = require( '../../testFramework');
file('typing/tuple');

expect([['hi']], `
    let a: ([String]) = ['hi'];
`);

expect('TypeError', `
    let b: ([String]) = ['hi', 1];
`);

expect('TypeError', `
    let c: ([String]) = [11];
`);