const {expect, file} = require( '../../testFramework');
file('typing/returns');

expect(['<Func>', [10]], `
    let append_ = func (a: Array, item: Any): Array {
        return a + [item];
    };
    append_([], 10);
`);
expect('TypeError', `
    let append_ = func (a: Array, item: Any): Number {
        return a + [item];
    };
    append_([], 10);
`);