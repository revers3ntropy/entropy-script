const {expect, file} = require( '../../testFramework');
file('std/using');

expect([undefined], `
    using({});
`);

expect([undefined, 1], `
    using({a: 1});
    a;
`);

expect('TypeError', `
    using('a: 1');
    a;
`);

expect([undefined, 0], `
    using({ a: 0 });
    a;
`);

expect([undefined, '<Func>'], `
    using(import('ascii'));
    asciiToChar;
`);