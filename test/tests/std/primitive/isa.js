let {expect, file} = require( '../../../testFramework');
file('std/primitive/isa');

expect ([0, true, false, false, false, false, false, false, false, false], `
    let a = 0;
    a.isa(Number);
    a.isa(String);
    a.isa(Func);
    a.isa(Array);
    a.isa(Bool);
    a.isa(Type);
    a.isa(Undefined);
    a.isa(Object);
    a.isa(Error);
`);


expect (['', false, true, false, false, false, false, false, false, false], `
    let a = '';
    a.isa(Number);
    a.isa(String);
    a.isa(Func);
    a.isa(Array);
    a.isa(Bool);
    a.isa(Type);
    a.isa(Undefined);
    a.isa(Object);
    a.isa(Error);
`);

expect (['<Func>', false, false, true, false, false, false, false, false, false], `
    let a = func () {};
    a.isa(Number);
    a.isa(String);
    a.isa(Func);
    a.isa(Array);
    a.isa(Bool);
    a.isa(Type);
    a.isa(Undefined);
    a.isa(Object);
    a.isa(Error);
`);

expect ([[], false, false, false, true, false, false, false, false, false], `
    let a = [];
    a.isa(Number);
    a.isa(String);
    a.isa(Func);
    a.isa(Array);
    a.isa(Bool);
    a.isa(Type);
    a.isa(Undefined);
    a.isa(Object);
    a.isa(Error);
`);

expect ([false, false, false, false, false, true, false, false, false, false], `
    let a = false;
    a.isa(Number);
    a.isa(String);
    a.isa(Func);
    a.isa(Array);
    a.isa(Bool);
    a.isa(Type);
    a.isa(Undefined);
    a.isa(Object);
    a.isa(Error);
`);

expect (['a', false, false, false, false, false, true, false, false, false], `
    let a = class {};
    a.isa(Number);
    a.isa(String);
    a.isa(Func);
    a.isa(Array);
    a.isa(Bool);
    a.isa(Type);
    a.isa(Undefined);
    a.isa(Object);
    a.isa(Error);
`);

expect ([undefined, false, false, false, false, false, false, true, false, false], `
    let a = nil;
    a.isa(Number);
    a.isa(String);
    a.isa(Func);
    a.isa(Array);
    a.isa(Bool);
    a.isa(Type);
    a.isa(Undefined);
    a.isa(Object);
    a.isa(Error);
`);

expect ([{}, false, false, false, false, false, false, false, true, false], `
    let a = {};
    a.isa(Number);
    a.isa(String);
    a.isa(Func);
    a.isa(Array);
    a.isa(Bool);
    a.isa(Type);
    a.isa(Undefined);
    a.isa(Object);
    a.isa(Error);
`);

expect (['myClass', {}, false, false, false, false, false, false, false, true, false, true], `
    let myClass = class {};
    let a = myClass();
    a.isa(Number);
    a.isa(String);
    a.isa(Func);
    a.isa(Array);
    a.isa(Bool);
    a.isa(Type);
    a.isa(Undefined);
    a.isa(Object);
    a.isa(Error);
    a.isa(myClass);
`);

expect ([false, undefined, true], `
    let var res = false;
    try {
        throw();
    } catch {
        res =
            !err.isa(Number) && 
            !err.isa(String) &&
            !err.isa(Func) &&
            !err.isa(Array) &&
            !err.isa(Bool) &&
            !err.isa(Type) &&
            !err.isa(Undefined) &&
            !err.isa(Object) &&
            err.isa(Error);
    }
    res;
`);