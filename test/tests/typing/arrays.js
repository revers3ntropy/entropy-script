const {expect, file} = require( '../../testFramework');
file('typing/arrays');

expect([['hi']], `
    let arr: (Arr[Str]) = ['hi'];
`);

expect('TypeError', `
    let arr: (Arr[Str]) = ['hi', 1];
`);

expect('TypeError', `
    let arr: (Arr[Str & 'hello']) = ['hi'];
`);

expect([['hi', {}]], `
    let arr: (Arr[Str | {}]) = ['hi', {}];
`);

expect('TypeError', `
    let arr: (Arr[Str | {}]) = ['hi', {}, {b: 1}];
`);

expect([['hi', ['hi']]], `
    let arr: (Arr[Str | Arr[Str]]) = ['hi', ['hi']];
`);

expect('TypeError', `
    let arr: (Arr[Str | Arr[Str]]) = ['hi', ['hi', 1]];
`);

expect(['Str'], `
    let arr: (Arr.__type__) = Str;
`);

expect('TypeError', `
    let arr: (Arr.__type__) = '';
`);

expect([['hi']], `
    let arr: (Arr[Any][1]) = ['hi'];
`);

expect([[]], `
    let arr: (Arr[Any][0]) = [];
`);

expect([[]], `
    let arr: (Arr[Any][-1]) = [];
`);

expect([[1, 3, 4]], `
    let arr: (Arr[Any][-1]) = [1, 3, 4];
`);

expect('TypeError', `
    let arr: (Arr[Any][0]) = ['hi', 'hi'];
`);

expect('TypeError', `
    let arr: (Arr[Any][2]) = [1];
`);