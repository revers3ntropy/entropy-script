import {expect, file} from '../../testFramework.js';
file('std/primitive/clone');

expect([{}, false, true], `
    a = {};
    a.is(a.clone());
    a == a.clone();
`);