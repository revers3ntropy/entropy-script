import {expect} from '../testFramework.js';

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