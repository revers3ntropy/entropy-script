const {expect, file} = require( '../../testFramework');
file('typing/parameters');

expect(['<Func>', 'hello world'], `
    const f = func (a: string, b: string) {
        return a + b;
    };
    f('hello', ' world');
`);
expect(['<Func>', 21], `
    const f = func (x: number){
        return 2 * x + 1;
    };
    f(10);
`);
expect('TypeError', `
    const f = func (x: number) {
        return 2 * x + 1;
    };
    f([10]);
`);

expect(['<Type: Concatenator>', {concat: '<Func>', str: 'hello '}, 'hello world'], `
    const Concatenator = class {
        init (str1: string) {
            this.str = str1;
        }
        
        concat (str2: string): string {
            return this.str + str2;
        }
    };
    
    const concat = Concatenator('hello ');
    concat.concat('world');
    
`);
expect('TypeError', `
    const Concatenator = class {
        init (str1: string) {
            this.str = str1;
        }
    };
    const concat = Concatenator(12);
`);