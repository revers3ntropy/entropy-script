import {expect, file} from '../testFramework.js';
file('basic/operatorOverride');

expect(['<Type: myClass>', 'myClass', 11], `
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

/*
expect(['<Type: myClass>', 'myClass', 1], `
    var myClass = class {        
        __getProperty__ (key) {
            val = {
                a: 1
            };
            return val[key];
        }
    };
    
    let a = myClass();
    a.a;
`);
 */