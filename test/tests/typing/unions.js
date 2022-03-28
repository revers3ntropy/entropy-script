const {expect, file} = require( '../../testFramework');
file('typing/unions');

expect([1, ' '], `
    let var b: (Str | Num) = 1;
    b = ' ';
`);

expect('TypeError', `
    let var b: (Str | Num) = 1;
    b = ' ';
    b = nil;
`);

expect([1], `
    let b: (1 | 2 | 3 | 4) = 1;
`);

expect('TypeError', `
    let b: (1 | 2 | 3 | 4) = 5;
`);

expect('TypeError', `
    let b: (?Str) = 5;
`);

expect(['5'], `
    let b: (?Str) = '5';
`);

expect([undefined, 1], `
    let var b: (?1);
    b = 1;
`);

expect('TypeError', `
    let var b: (?1);
    b = 2;
`);

expect([2, 1, undefined], `
    let var b: (?Num) = 2;
    b = 1;
    b = nil;
`);
expect('TypeError', `
    let var b: (?Num) = 2;
    b = 1;
    b = nil;
    b = Null;
`);