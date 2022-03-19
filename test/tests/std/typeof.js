const {expect, file} = require( '../../testFramework');
file('std/typeof');

expect([1, 'Number'], `
    let b: Number = 1;
    typeof('b');
`);

expect([1, '(Number) | (String)', 'Number'], `
    let b: (Number | String) = 1;
    typeof('b');
    Type(b);
`);