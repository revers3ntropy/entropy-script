const {expect, file} = require( '../../testFramework');
file('typing/unions');

expect([1, ' '], `
    var b: (String | Number) = 1;
    b = ' ';
`);

expect('TypeError', `
    var b: (String | Number) = 1;
    b = ' ';
    b = nil;
`);

expect([1], `
    var b: (1 | 2 | 3 | 4) = 1;
`);

expect('TypeError', `
    var b: (1 | 2 | 3 | 4) = 5;
`);

expect('TypeError', `
    var b: (?String) = 5;
`);

expect(['5'], `
    var b: (?String) = '5';
`);

expect([undefined, 1], `
    var b: (?1);
    b = 1;
`);

expect('TypeError', `
    var b: (?1);
    b = 2;
`);

expect([2, 1, undefined], `
    var b: (?Number) = 2;
    b = 1;
    b = nil;
`);
expect('TypeError', `
    var b: (?Number) = 2;
    b = 1;
    b = nil;
    b = Undefined;
`);