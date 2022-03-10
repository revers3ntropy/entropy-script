var {expect, file} = require( '../../../testFramework');
file('std/primitive/isa');

expect ([0, true, false, false, false, false, false, false, false, false], `
    var a = 0;
    a.isa(number);
    a.isa(string);
    a.isa(function);
    a.isa(array);
    a.isa(bool);
    a.isa(type);
    a.isa(undefined);
    a.isa(object);
    a.isa(error);
`);


expect (['', false, true, false, false, false, false, false, false, false], `
    var a = '';
    a.isa(number);
    a.isa(string);
    a.isa(function);
    a.isa(array);
    a.isa(bool);
    a.isa(type);
    a.isa(undefined);
    a.isa(object);
    a.isa(error);
`);

expect (['<Func>', false, false, true, false, false, false, false, false, false], `
    var a = func () {};
    a.isa(number);
    a.isa(string);
    a.isa(function);
    a.isa(array);
    a.isa(bool);
    a.isa(type);
    a.isa(undefined);
    a.isa(object);
    a.isa(error);
`);

expect ([[], false, false, false, true, false, false, false, false, false], `
    var a = [];
    a.isa(number);
    a.isa(string);
    a.isa(function);
    a.isa(array);
    a.isa(bool);
    a.isa(type);
    a.isa(undefined);
    a.isa(object);
    a.isa(error);
`);

expect ([false, false, false, false, false, true, false, false, false, false], `
    var a = false;
    a.isa(number);
    a.isa(string);
    a.isa(function);
    a.isa(array);
    a.isa(bool);
    a.isa(type);
    a.isa(undefined);
    a.isa(object);
    a.isa(error);
`);

expect (['a', false, false, false, false, false, true, false, false, false], `
    var a = class {};
    a.isa(number);
    a.isa(string);
    a.isa(function);
    a.isa(array);
    a.isa(bool);
    a.isa(type);
    a.isa(undefined);
    a.isa(object);
    a.isa(error);
`);

expect ([undefined, false, false, false, false, false, false, true, false, false], `
    var a = nil;
    a.isa(number);
    a.isa(string);
    a.isa(function);
    a.isa(array);
    a.isa(bool);
    a.isa(type);
    a.isa(undefined);
    a.isa(object);
    a.isa(error);
`);

expect ([{}, false, false, false, false, false, false, false, true, false], `
    var a = {};
    a.isa(number);
    a.isa(string);
    a.isa(function);
    a.isa(array);
    a.isa(bool);
    a.isa(type);
    a.isa(undefined);
    a.isa(object);
    a.isa(error);
`);

expect (['myClass', {}, false, false, false, false, false, false, false, true, false, true], `
    var myClass = class {};
    var a = myClass();
    a.isa(number);
    a.isa(string);
    a.isa(function);
    a.isa(array);
    a.isa(bool);
    a.isa(type);
    a.isa(undefined);
    a.isa(object);
    a.isa(error);
    a.isa(myClass);
`);

expect ([false, undefined, true], `
    var res = false;
    try {
        throw();
    } catch {
        res =
            !err.isa(number) && 
            !err.isa(string) &&
            !err.isa(function) &&
            !err.isa(array) &&
            !err.isa(bool) &&
            !err.isa(type) &&
            !err.isa(undefined) &&
            !err.isa(object) &&
            err.isa(error);
    }
    res;
`);