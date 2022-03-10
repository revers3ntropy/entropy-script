const {expect, file} = require( '../../testFramework');
file('typing/not');

expect([1], `
    var b: (~string) = 1;
`);

expect('TypeError', `
    let b: (~string) = 'hi;
`);