const {expect, file} = require( '../../testFramework');
file('typing/tuple');

expect([['hi']], `
    let b: [String] = ['hi'];
`);

expect('TypeError', `
    let b: [String] = ['hi', 1];
`);

expect('TypeError', `
    let b: [String] = [11];
`);