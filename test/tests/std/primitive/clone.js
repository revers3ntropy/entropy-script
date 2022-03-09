const {expect, file} = require( '../../../testFramework');
file('std/primitive/clone');

expect([{}, false, true], `
    let a = {};
    a.is(a.clone());
    a == a.clone();
`);