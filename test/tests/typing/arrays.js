const {expect, file} = require( '../../testFramework');
file('typing/arrays');

expect([['hi']], `
    let arr: (array[string]) = ['hi'];
`);

expect('TypeError', `
    let arr: (array[string]) = ['hi', 1];
`);

expect('TypeError', `
    let arr: (array[string & 'hello']) = ['hi'];
`);

expect([['hi', {}]], `
    let arr: (array[string | {}]) = ['hi', {}];
`);

expect('TypeError', `
    let arr: (array[string | {}]) = ['hi', {}, {b: 1}];
`);

expect([['hi', ['hi']]], `
    let arr: (array[string | array[string]]) = ['hi', ['hi']];
`);

expect('TypeError', `
    let arr: (array[string | array[string]]) = ['hi', ['hi', 1]];
`);

expect(['String'], `
    let arr: (array.__type__) = string;
`);

expect('TypeError', `
    let arr: (array.__type__) = '';
`);
