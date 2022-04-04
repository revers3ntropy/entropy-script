let {expect, file} = require( '../../testFramework');
file('typing/parameters');

expect(['<Func>', 'hello world'], `
    let f = func (a: Str, b: Str) {
        return a + b;
    };
    f('hello', ' world');
`);
expect(['<Func>', 21], `
    let f = func (x: Num) {
        return 2 * x + 1;
    };
    f(10);
`);
expect('TypeError', `
    let f = func (x: Num) {
        return 2 * x + 1;
    };
    f([10]);
`);

expect(['Concatenator', {concat: '<Func>', str: 'hello ', init: '<Func>'}, 'hello world'], `
    class Concatenator {
        str;
        init (str1: Str) {
            this.str = str1;
        }
        
        concat (str2: Str): Str {
            return this.str + str2;
        }
    };
    
    let concat = Concatenator('hello ');
    concat.concat('world');
    
`);
expect('TypeError', `
    let Concatenator = class {
        str;
        init (str1: Str) {
            this.str = str1;
        }
    };
    let concat = Concatenator(12);
`);