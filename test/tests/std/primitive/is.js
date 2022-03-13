let {expect, file} = require( '../../../testFramework');
file('std/primitive/is');

expect([1, true, false, false], `
    let a = 1;
    a.is(a);
    a.is(1);
    a.is(2);
`);

expect(['', true, false, false], `
    let a = '';
    a.is(a);
    a.is('');
    a.is(' ');
`);

expect([[], true, false, false], `
    let a = [];
    a.is(a);
    a.is([]);
    a.is([a]);
`);

expect([undefined, true, true, false], `
    let a = nil;
    a.is(nil);
    a.is(a);
    a.is(Undefined);
`);

expect(['Undefined', true, true, false], `
    let a = Undefined;
    a.is(Undefined);
    a.is(a);
    a.is(nil);
`);

expect([{}, true, false, false], `
    let a = {};
    a.is(a);
    a.is(a.clone());
    a.is({});
`);