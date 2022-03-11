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

expect('TypeError', `
    let parentClass = class {};
    let childClass1 = class extends parentClass {};
    let childClass2 = class extends parentClass {};
    let a: childClass2 = childClass1();
`);