const {expect, file} = require( '../../testFramework');
file('basic/destructuring');

expect([[]], `
    let [] = [];
`);

expect([[1, 2], 1, 2], `
    let [a, b] = [1, 2];
    a; b;
`);

expect([[1, 2, 3], 1, 2], `
    let [a, b] = [1, 2, 3];
    a; b;
`);

expect('IndexError', `
    let [a, b] = [1];
    a; b;
`);

expect(['hi', 'h', 'i'], `
    let [a, b] = 'hi';
    a; b;
`);

expect([2, 0, 1], `
    let [a, b] = 2;
    a; b;
`);

expect('IndexError', `
    let [a, b, c] = 2;
    a; b;
`);

expect([{a: 2, b: 3}, 2, 3], `
    let [a, b] = {a: 2, b: 3};
    a; b;
`);

expect('IndexError', `
    let [a, b] = {a: 2, c: 3};
    a; b;
`);

expect([[1, 2], 1, 2], `
    let [a: Num, b: Num] = [1, 2];
    a; b;
`);

expect([[1, undefined], 1, undefined], `
    let [a: Num, b: ?Num] = [1, nil];
    a; b;
`);

expect('TypeError', `
    let [a: Num, b: Num] = [1, 'hi'];
    a; b;
`);

expect('TypeError', `
    let [a: Num, b: Num] = {a: 1, b: nil};
`);

expect(['<Func>', 3, 2], `
    func F (**) {
        let global [ b ] = kwargs;
        b + 1;
    };
    F(*b=2);
    b;
`);