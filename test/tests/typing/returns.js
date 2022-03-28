const {expect, file} = require( '../../testFramework');
file('typing/returns');

expect(['<Func>', [10]], `
    let append_ = func (a: Arr, item: Any): Arr {
        return a + [item];
    };
    append_([], 10);
`);
expect('TypeError', `
    let append_ = func (a: Arr, item: Any): Num {
        return a + [item];
    };
    append_([], 10);
`);