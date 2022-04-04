const {expect, file} = require( '../../testFramework');
file('basic/operatorOverride');

expect([
    'A',
    {a: 12, __multiply__: '<Func>', init: '<Func>'}, 12
], `
    class A {
        a: Num;
        init (a: Num) {
            this.a = a;
        }
        
        __multiply__ (b) {
            let res = this.clone();
            res.a = this.a * b.a;
            return res;
        }
    };
    
    let a = A(3) * A(4);
    a.a;
`);