import {expect, file} from '../../testFramework';
file('std/range');


expect([[0, 1, 2]], 'range(3)');
expect ([undefined, 2], `
    for global i in range(3) {}
    i;
`);