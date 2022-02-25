const {expect, file} = require( '../../testFramework');
file('basic/arrays');

expect([[0, 1, 2]], `
    [0, 1, 2];
`);
expect([[[6, 8], 1, [8, 9]]], `
    [[6, 8], 1, [8, 9]];
`);
expect([[0, 1, 2], 1], `
    var arr = [0, 1, 2];
    arr[1];
`);
expect([[[1, 2], 1, 2], 2], `
    var arr = [[1, 2], 1, 2];
    arr[0][1];
`);
expect([[0, 1, 2], 2, [0, 2, 2]], `
    var arr = [0, 1, 2];
    arr[1] = 2;
    arr;
`);
expect([[[1, 5], 1, 2], 5, [[1, 5], 1, 2]], `
    var arr = [[1, 2], 1, 2];
    arr[0][1] = 5;
    arr;
`);

expect([true], `[] == []`);
expect([true], `[0, 1] == [0, 1]`);
expect([true], `[0, 1] != [2, 3]`);
expect([false], `[0, 1, 2] == [2, 3]`);

expect([[]], `[] + []`);
expect([[0, 1, 0, 1]], `[0, 1] + [0, 1]`);
expect([[0, 1, '']], `[0, 1] + ['']`);
expect([[0, 1, '', {}]], `[0, 1, ''] + [{}]`);
expect('TypeError', `[] + 1`);
expect('TypeError', `[] + ''`);
expect('TypeError', `[] + nil`);
expect('TypeError', `[] + type`);
expect('TypeError', `[] + string`);
expect('TypeError', `[] + (func () {})`);
expect('TypeError', `+[]`);


expect('TypeError', `[] - []`);
expect('TypeError', `[0, 1] - [0, 1]`);
expect('TypeError', `[] - 1`);
expect('TypeError', `[] - ''`);
expect('TypeError', `[] - nil`);
expect('TypeError', `[] - type`);
expect('TypeError', `[] - string`);
expect('TypeError', `[] - (func () {})`);
expect('TypeError', `-[]`);