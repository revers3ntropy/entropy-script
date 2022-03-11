const {expect, file} = require( '../../testFramework');
file('typing/unions');

expect([1, ' '], `
    var b: (string | number) = 1;
    b = ' ';
`);

expect('TypeError', `
    var b: (string | number) = 1;
    b = ' ';
    b = nil;
`);

expect([1], `
    var b: (1 | 2 | 3 | 4) = 1;
`);

expect('TypeError', `
    var b: (1 | 2 | 3 | 4) = 5;
`);