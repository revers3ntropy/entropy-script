let {expect, file} = require( '../../../testFramework');
file('std/primitive/__subtype_of__');

expect([true], `
    Str.__subtype_of__(Str);
`);
expect(['A', true], `
    class A {};
    A.__subtype_of__(A);
`);
expect(['A', {}, false, false], `
    class A {};
    let a = A();
    a.__subtype_of__(A);
    A.__subtype_of__(a);
`);
expect(['A', 'B', {}, {}, false, false, false, false, false, false, false, true, true, false, true], `
    class A {};
    class B extends A {};
    let a = A();
    let b = B();
    
    a.__subtype_of__(A);
    A.__subtype_of__(a);
    a.__subtype_of__(B);
    A.__subtype_of__(b);
    b.__subtype_of__(B);
    b.__subtype_of__(A);
    B.__subtype_of__(a);
    
    B.__subtype_of__(B);
    A.__subtype_of__(A);
    A.__subtype_of__(B);
    B.__subtype_of__(A);
`);