import {expect, file} from '../../testFramework.js';
file('typing/returns');

expect(['<Func>', [10]], `
    const append_ = func (a: array, item: any): array {
        a.add(item);
        return a;
    };
    append_([], 10);
`);
expect('TypeError', `
    const append_ = func (a: array, item: any): number {
        a.add(item);
        return a;
    };
    append_([], 10);
`);