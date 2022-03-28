const {expect, file} = require( '../../testFramework');
file('std/typeof');

expect([1, 'Num'], `
    let b: Num = 1;
    typeof('b');
`);

expect([1, '(Num) | (Str)', 'Num'], `
    let b: (Num | Str) = 1;
    typeof('b');
    Type(b);
`);