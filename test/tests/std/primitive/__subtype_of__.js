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
expect(['', true, true, false, true], `
    let a = '';
    a.__subtype_of__(Str);
    a.__subtype_of__(Any);
    a.__subtype_of__(' ');
    a.__subtype_of__('');
`);
expect(['Str', true, true, false, false], `
    let a = Str;
    a.__subtype_of__(Str);
    a.__subtype_of__(Any);
    a.__subtype_of__(' ');
    a.__subtype_of__('');
`);
expect(['(Str) | (Str)', true, true], `
    let a: Any = Str | Str;
    a.__subtype_of__(Str);
    a.__subtype_of__(Str | Str);
`);
expect(['(Str) & (Str)', true, "(Str) & ()", true], `
    let var a = Str & Str;
    a.__subtype_of__(Str);
    a = Str & '';
    a.__subtype_of__(Str);
`);
expect(["(hi) | ()", true, "(hi) | (1)", false], `
    let var a = 'hi' |  '';
    a.__subtype_of__(Str);
    a = 'hi' | 1;
    a.__subtype_of__(Str);
`);
/*
expect([true, true, true, false, false], `
    Num.__subtype_of__(~Str);
    Num.__subtype_of__(~Str & ~Bool);
    Num.__subtype_of__(~(Str | Bool));
    Num.__subtype_of__(~Str & ~Bool & ~Num);
    Num.__subtype_of__(~Str & ~Bool & ~1);
`);

expect(['(fish) | (dog)', false, true, true, true, false, false], `
    let A = 'fish' | 'dog';
    A.__subtype_of__(~Str);
    A.__subtype_of__(Str);
    A.__subtype_of__(Str | Str);
    A.__subtype_of__(~Num & ~Bool);
    A.__subtype_of__(~Num & ~Bool & ~Str);
    A.__subtype_of__(~Num & ~(Bool | Str | 1));
`);
*/
expect([true, true, true, true], `
    Arr.__subtype_of__(Arr);
    Arr<|Str|>.__subtype_of__(Arr);
    Arr<|Str, 1|>.__subtype_of__(Arr);
    Arr<|Str, 1|>.__subtype_of__(Arr<|Str|>);
`);
expect([false, false, false, false], `
    Arr<|Str|>.__subtype_of__(Arr<|Num|>);
    Arr<|Str|>.__subtype_of__(Arr<|Str, 1|>);
    Arr<|Str, 1|>.__subtype_of__(Arr<|Str, 2|>);
    Arr<|Str, 1|>.__subtype_of__(Arr<|Str, 2|>);
`);