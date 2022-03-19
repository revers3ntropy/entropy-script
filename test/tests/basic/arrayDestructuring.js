const {expect, file} = require( '../../testFramework');
file('basic/arrayDestructuring');

expect([[1, 2], 1, 2], `
    let [a b] = [1, 2];
    a; b;
`);

expect([[1, 2, 3], 1, 2], `
    let [a b] = [1, 2, 3];
    a; b;
`);

expect('TypeError', `
    let [a b] = [1];
    a; b;
`);

expect(['hi', 'h', 'i'], `
    let [a b] = 'hi';
    a; b;
`);

expect('IndexError', `
    let [a b] = 2;
    a; b;
`);

expect([{a: 2, b: 3}, 2, 3], `
    let [a b] = {a: 2, b: 3};
    a; b;
`);

expect('IndexError', `
    let [a b] = {a: 2, c: 3};
    a; b;
`);