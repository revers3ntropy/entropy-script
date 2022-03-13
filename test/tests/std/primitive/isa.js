var {expect, file} = require( '../../../testFramework');
file('std/primitive/isa');

expect ([0, true, false, false, false, false, false, false, false, false], `
    var a = 0;
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
    var a = '';
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
    var a = func () {};
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
    var a = [];
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
    var a = false;
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
    var a = class {};
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
    var a = nil;
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
    var a = {};
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
    var myClass = class {};
    var a = myClass();
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
    var res = false;
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