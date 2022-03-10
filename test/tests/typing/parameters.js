let {expect, file} = require( '../../testFramework');
file('typing/parameters');

expect(['<Func>', 'hello world'], `
    let f = func (a: string, b: string) {
        return a + b;
    };
    f('hello', ' world');
`);
expect(['<Func>', 21], `
    let f = func (x: number){
        return 2 * x + 1;
    };
    f(10);
`);
expect('TypeError', `
    let f = func (x: number) {
        return 2 * x + 1;
    };
    f([10]);
`);

expect(['Concatenator', {concat: '<Func>', str: 'hello '}, 'hello world'], `
    let Concatenator = class {
        init (str1: string) {
            this.str = str1;
        }
        
        concat (str2: string): string {
            return this.str + str2;
        }
    };
    
    let concat = Concatenator('hello ');
    concat.concat('world');
    
`);
expect('TypeError', `
    let Concatenator = class {
        init (str1: string) {
            this.str = str1;
        }
    };
    let concat = Concatenator(12);
`);