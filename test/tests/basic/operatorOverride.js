const {expect, file} = require( '../../testFramework');
file('basic/operatorOverride');

expect([
    'myClass',
    {a: 12, __multiply__: '<Func>'}, 12
], `
    let myClass = class {
        init (a) {
            this.a = a;
        }
        
        __multiply__ (b) {
            let res = this.clone();
            res.a = this.a * b.a;
            return res;
        }
    };
    
    let a = myClass(3) * myClass(4);
    let b = a.a; 
`);