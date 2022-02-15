import {expect} from '../testFramework.js';

expect([undefined], `
    if !true && 1 || 7 + 2 {} else {}
`);
expect(['00', undefined], `
    const current_char = '00';
    if current_char == '>' {}
`);
expect([false, undefined, undefined, true], `
    var result = false;
    var output;
    if result {
        output = false;
    } else {
        output = !result;
    }
    output;
`);
expect([false, undefined, undefined, true], `
    var result = false;
    var output;
    if result {
        output = false;
    } else if 1 != 6 {
        output = !result;
    }
    output;
`);
expect([undefined, undefined, false], `
    var output;
    if true {
        output = true;
        output = false;
    } else {
        output = 1;
    }
    output;
   
`);