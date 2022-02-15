import {expect} from '../../testFramework.js';

expect ([0, true, false, false, false, false, false, false, false, false], `
    const a = 0;
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
    const a = '';
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

expect (['<Func: a>', false, false, true, false, false, false, false, false, false], `
    const a = func () {};
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
    const a = [];
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
    const a = false;
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

expect (['<Type: a>', false, false, false, false, false, true, false, false, false], `
    const a = class {};
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
    const a = nil;
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
    const a = {};
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

// error? can't really do...