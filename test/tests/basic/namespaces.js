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
    {myClass: '<Symbol: myClass>', my_func: '<Symbol: my_func>', a: '<Symbol: a>'},
    'myClass', {thing: 123, init: '<Func>'}, 123, 'Hello world!'
], `
    let global MyLib = namespace {
        let myClass = class {
            thing;
            init () {
                this.thing = 123;
            }
        };
    
        let my_func = func (obj: myClass) {
            return obj.thing;
        };
    
        let a = 'Hello world!';
    };
    
    let myType = MyLib.myClass;
    let instance: myType = MyLib.myClass();
    MyLib.my_func(instance);
    MyLib.a;
`);

expect([undefined, 1], `
    using(namespace {
        let a: Num = 1;
    });
    a;
`);
