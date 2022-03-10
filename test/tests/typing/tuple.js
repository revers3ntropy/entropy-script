const {expect, file} = require( '../../testFramework');
file('typing/tuple');

expect([['hi']], `
    let b: [string] = ['hi'];
`);

expect('TypeError', `
    let b: [string] = ['hi', 1];
`);

expect('TypeError', `
    let b: [string] = [11];
`);