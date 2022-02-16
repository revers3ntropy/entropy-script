import {expect, file} from '../../testFramework.js';
file('std/primitive/is');

expect([1, true, false, false], `
    a = 1;
    a.is(a);
    a.is(1);
    a.is(2);
`);

expect(['', true, false, false], `
    a = '';
    a.is(a);
    a.is('');
    a.is(' ');
`);

expect([[], true, false, false], `
    a = [];
    a.is(a);
    a.is([]);
    a.is([a]);
`);

expect([undefined, true, true, false], `
    a = nil;
    a.is(nil);
    a.is(a);
    a.is(undefined);
`);

expect(['<Type: Undefined>', true, true, false], `
    a = undefined;
    a.is(undefined);
    a.is(a);
    a.is(nil);
`);

expect([{}, true, false, false], `
    a = {};
    a.is(a);
    a.is(a.clone());
    a.is({});
`);