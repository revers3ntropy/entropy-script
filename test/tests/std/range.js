const {expect, file} = require( '../../testFramework');
file('std/range');

expect([[0, 1, 2]], 'range(3)');
expect ([undefined, undefined, 2], `
    let var res;
    for let i in range(3) {
        res = i;
    }
    res;
`);
expect([[1]], 'range(1, 2)');
expect([[1, 2, 3, 4]], 'range(1, 5)');
expect([[-1]], 'range(-1, 0)');
expect([[-1, 1, 3]], 'range(-1, 5, 2)');