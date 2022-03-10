const {expect, file} = require( '../../../testFramework');
file('std/primitive/is');

expect([1, true, false, false], `
    const a = 1;
    a.is(a);
    a.is(1);
    a.is(2);
`);

expect(['', true, false, false], `
    const a = '';
    a.is(a);
    a.is('');
    a.is(' ');
`);

expect([[], true, false, false], `
    const a = [];
    a.is(a);
    a.is([]);
    a.is([a]);
`);

expect([undefined, true, true, false], `
    const a = nil;
    a.is(nil);
    a.is(a);
    a.is(undefined);
`);

expect(['Undefined', true, true, false], `
    const a = undefined;
    a.is(undefined);
    a.is(a);
    a.is(nil);
`);

expect([{}, true, false, false], `
    const a = {};
    a.is(a);
    a.is(a.clone());
    a.is({});
`);