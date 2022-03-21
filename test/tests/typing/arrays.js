const {expect, file} = require( '../../testFramework');
file('typing/arrays');

expect([['hi']], `
    let arr: (Array[String]) = ['hi'];
`);

expect('TypeError', `
    let arr: (Array[String]) = ['hi', 1];
`);

expect('TypeError', `
    let arr: (Array[String & 'hello']) = ['hi'];
`);

expect([['hi', {}]], `
    let arr: (Array[String | {}]) = ['hi', {}];
`);

expect('TypeError', `
    let arr: (Array[String | {}]) = ['hi', {}, {b: 1}];
`);

expect([['hi', ['hi']]], `
    let arr: (Array[String | Array[String]]) = ['hi', ['hi']];
`);

expect('TypeError', `
    let arr: (Array[String | Array[String]]) = ['hi', ['hi', 1]];
`);

expect(['String'], `
    let arr: (Array.__type__) = String;
`);

expect('TypeError', `
    let arr: (Array.__type__) = '';
`);

expect([['hi']], `
    let arr: (Array[Any][1]) = ['hi'];
`);

expect([[]], `
    let arr: (Array[Any][0]) = [];
`);

expect([[]], `
    let arr: (Array[Any][-1]) = [];
`);

expect([[1, 3, 4]], `
    let arr: (Array[Any][-1]) = [1, 3, 4];
`);

expect('TypeError', `
    let arr: (Array[Any][0]) = ['hi', 'hi'];
`);

expect('TypeError', `
    let arr: (Array[Any][2]) = [1];
`);