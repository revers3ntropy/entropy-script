import {expect, file} from '../testFramework.js';
file('typing/custom');

expect(['<Type: myType>', {}, {}], `
    const myType = class {};
    let myInstance = myType();
    let a: myType = myInstance;
`);

expect('TypeError', `
    const myType = class {};
    let myInstance = myType();
    let a: myType = 1;
`);