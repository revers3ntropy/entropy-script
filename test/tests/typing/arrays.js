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
