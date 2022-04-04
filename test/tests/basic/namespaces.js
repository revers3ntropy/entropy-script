let {expect, file} = require( '../../testFramework');
file('basic/namespaces');

expect([{}], `
    let MyLib = namespace {};
`);
expect([{}], `
    namespace myLib {};
`);
expect([{a: '<Symbol: a>'}, 'hi'], `
    let global MyLib = namespace {
        let a = 'hi';
    };
   MyLib.a;
`);
expect('TypeError', `
    let global MyLib = namespace {
        let a: Num = 0;
    };
    MyLib.a = 1;
`);
expect([
    {myClass: '<Symbol: myClass>', myFunc: '<Symbol: myFunc>', a: '<Symbol: a>'},
    'myClass', {thing: 123, init: '<Func>'}, 123, 'Hello world!'
], `
    let global MyLib = namespace {
        let myClass = class {
            thing;
            init () {
                this.thing = 123;
            }
        };
    
        let myFunc = func (obj: myClass) {
            return obj.thing;
        };
    
        let a = 'Hello world!';
    };
    
    let myType = MyLib.myClass;
    let instance: myType = MyLib.myClass();
    MyLib.myFunc(instance);
    MyLib.a;
`);

expect([undefined, 1], `
    using(namespace {
        let a: Num = 1;
    });
    a;
`);
