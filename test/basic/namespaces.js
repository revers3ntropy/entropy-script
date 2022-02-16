import {expect, file} from '../testFramework.js';
file('basic/namespaces');

expect([{}], `
    const MyLib = namespace {};
`);
expect([{a: '<Symbol: a>'}, 'hi'], `
    global const MyLib = namespace {
        const a = 'hi';
    };
   MyLib.a;
`);
expect('TypeError', `
    global const MyLib = namespace {
        const a: number = 0;
    };
   MyLib.a = 1;
`);
expect([{a: '<Symbol: a>'}, 1, 1], `
    global MyLib = namespace {
        mutable a: number = 0;
    };
   MyLib.a = 1;
   MyLib['a'];
`);
expect([{myClass: '<Symbol: myClass>', myFunc: '<Symbol: myFunc>', a: '<Symbol: a>'}, '<Type: myClass>', 'myClass', 123, 'Hello world!'], `
    global const MyLib = namespace {
        const myClass = class {
            init () {
                this.thing = 123;
            }
        };
    
        const myFunc = func (obj: myClass) {
            return obj.thing;
        };
    
        const a = 'Hello world!';
    };
    
    let myType = MyLib.myClass;
    let const instance: myType = MyLib.myClass();
    MyLib.myFunc(instance);
    MyLib.a;
`);

expect([undefined, 1], `
    using(namespace {
        mutable a: number = 1;
    });
    a;
`);
