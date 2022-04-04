const {expect, file} = require( '../../testFramework');
file('basic/operatorOverride');

expect([
    'myClass',
    {a: 12, __multiply__: '<Func>', init: '<Func>'}, 12
], `
    class A {
        a;
        init (a) {
            this.a = a;
        }
        
        __multiply__ (b) {
            let res = this.clone();
            res.a = this.a * b.a;
            return res;
        }
    };
    
    let a = A(3) * A(4);
    print(a.a); 
`);