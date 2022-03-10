const {expect, file} = require( '../../testFramework');
file('typing/custom');

expect(['myType', {}, {}], `
    let myType = class {};
    let myInstance = myType();
    let a: myType = myInstance;
`);

expect('TypeError', `
    let myType = class {};
    let myInstance = myType();
    let a: myType = 1;
`);