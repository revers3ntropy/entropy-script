let {expect, file} = require( '../../../testFramework');
file('std/primitive/isa');

expect ([0, true, false, false, false, false, false, false, false, false], `
    let a = 0;
    a.isa(Num);
    a.isa(Str);
    a.isa(Func);
    a.isa(Arr);
    a.isa(Bool);
    a.isa(Type);
    a.isa(Null);
    a.isa(Obj);
    a.isa(Err);
`);


expect (['', false, true, false, false, false, false, false, false, false], `
    let a = '';
    a.isa(Num);
    a.isa(Str);
    a.isa(Func);
    a.isa(Arr);
    a.isa(Bool);
    a.isa(Type);
    a.isa(Null);
    a.isa(Obj);
    a.isa(Err);
`);

expect (['<Func>', false, false, true, false, false, false, false, false, false], `
    let a = func () {};
    a.isa(Num);
    a.isa(Str);
    a.isa(Func);
    a.isa(Arr);
    a.isa(Bool);
    a.isa(Type);
    a.isa(Null);
    a.isa(Obj);
    a.isa(Err);
`);

expect ([[], false, false, false, true, false, false, false, false, false], `
    let a = [];
    a.isa(Num);
    a.isa(Str);
    a.isa(Func);
    a.isa(Arr);
    a.isa(Bool);
    a.isa(Type);
    a.isa(Null);
    a.isa(Obj);
    a.isa(Err);
`);

expect ([false, false, false, false, false, true, false, false, false, false], `
    let a = false;
    a.isa(Num);
    a.isa(Str);
    a.isa(Func);
    a.isa(Arr);
    a.isa(Bool);
    a.isa(Type);
    a.isa(Null);
    a.isa(Obj);
    a.isa(Err);
`);

expect (['a', false, false, false, false, false, true, false, false, false], `
    let a = class {};
    a.isa(Num);
    a.isa(Str);
    a.isa(Func);
    a.isa(Arr);
    a.isa(Bool);
    a.isa(Type);
    a.isa(Null);
    a.isa(Obj);
    a.isa(Err);
`);

expect ([undefined, false, false, false, false, false, false, true, false, false], `
    let a = nil;
    a.isa(Num);
    a.isa(Str);
    a.isa(Func);
    a.isa(Arr);
    a.isa(Bool);
    a.isa(Type);
    a.isa(Null);
    a.isa(Obj);
    a.isa(Err);
`);

expect ([{}, false, false, false, false, false, false, false, true, false], `
    let a = {};
    a.isa(Num);
    a.isa(Str);
    a.isa(Func);
    a.isa(Arr);
    a.isa(Bool);
    a.isa(Type);
    a.isa(Null);
    a.isa(Obj);
    a.isa(Err);
`);

expect (['myClass', {}, false, false, false, false, false, false, false, true, false, true], `
    let myClass = class {};
    let a = myClass();
    a.isa(Num);
    a.isa(Str);
    a.isa(Func);
    a.isa(Arr);
    a.isa(Bool);
    a.isa(Type);
    a.isa(Null);
    a.isa(Obj);
    a.isa(Err);
    a.isa(myClass);
`);

expect ([false, undefined, true], `
    let var res = false;
    try {
        throw();
    } catch {
        res =
            !err.isa(Num) && 
            !err.isa(Str) &&
            !err.isa(Func) &&
            !err.isa(Arr) &&
            !err.isa(Bool) &&
            !err.isa(Type) &&
            !err.isa(Null) &&
            !err.isa(Obj) &&
            err.isa(Err);
    }
    res;
`);