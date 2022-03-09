const {expect, file} = require( '../../testFramework');
file('typing/unions');

expect([1, ' '], `
    let b: string | number = 1;
    b = ' ';
`);

expect('TypeError', `
    let b: string | number = 1;
    b = nil;
`);