import {expect, file} from '../testFramework.js';
file('examples/vector');

expect(
    [
        '<Type: v2>',
        {x: 0, y: 0, add: '<Func: add>', str: '<Func: str>'},
        {x: 3, y: 4, add: '<Func: add>', str: '<Func: str>'},
        '3, 4',
        true,
        {x: 4, y: 5, add: '<Func: add>', str: '<Func: str>'},
        '3, 4',
        '4, 5'
],

`
    const v2 = class {
        init (x: number, y: number) {
            this.x = x;
            this.y = y;
        }
        
        add (v: any): any {
            this.x += v.x;
            this.y += v.y;
            return this;
        }
        
        str (): string {
            return this.x.str() + ', ' + this.y.str();
        }
    };
    
    var pos = v2(0, 0);
    pos.add(v2(3, 4));
    pos.str();
    pos.clone() == pos;
    var clone = pos.clone().add(v2(1, 1));
    pos.str();
    clone.str();
`);