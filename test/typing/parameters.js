import {expect} from '../testFramework.js';

expect(['<Func: f>', 'hello world'], `
    const f = func (a: string, b: string) {
        return a + b;
    };
    f('hello', ' world');
`);
expect(['<Func: f>', 21], `
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

expect(['<Type: Concatenator>', 'Concatenator', 'hello world'], `
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