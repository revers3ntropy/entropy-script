import {expect} from '../testFramework.js';

expect(['<Type: v2>', 'v2', 'v2', '3, 4', 'v2', '8, 10', false, 'v2', '8, 10', '9, 11'], `
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
        
        scale (n: number): any {
            this.x *= n;
            this.y *= n;
            return this;
        }
       
        clone (): any {
            return v2(this.x, this.y);
        }
        
        str (): string {
            return this.x.str() + ', ' + this.y.str();
        }
    };
    
    var pos = v2(0, 0);
    pos.add(v2(3, 4));
    pos.str();
    pos.add(v2(1, 1)).scale(2);
    pos.str();
    pos.clone() == pos;
    var clone = pos.clone().add(v2(1, 1));
    pos.str();
    clone.str();
`);