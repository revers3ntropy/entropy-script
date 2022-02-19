import {expect, file} from '../testFramework.js';
file('basic/operatorOverride');

expect([
    '<Type: myClass>',
    {a: 12, __multiply__: '<Func>'}, 12
], `
    var myClass = class {
        init (a) {
            this.a = a;
        }
        
        __multiply__ (b) {
            res = this.clone();
            res.a = this.a * b.a;
            return res;
        }
    };
    
    let a = myClass(3) * myClass(4);
    let b = a.a; 
`);