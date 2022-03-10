const {expect, file} = require( '../../testFramework');
file('typing/returns');

expect(['<Func>', [10]], `
    let append_ = func (a: array, item: any): array {
        a.add(item);
        return a;
    };
    append_([], 10);
`);
expect('TypeError', `
    let append_ = func (a: array, item: any): number {
        a.add(item);
        return a;
    };
    append_([], 10);
`);