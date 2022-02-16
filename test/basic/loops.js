import {expect, file} from '../testFramework.js';
file('basic/loops');

expect([undefined, 0, undefined, 9, 10], `
    var output;
    var i = 0;
    while i < 10 {
        output = i;
        i = i + 1;
    }
    output; i;
`);
expect([0, undefined, 10], `
    var i = 0;
    while i < 10 {
        i = i + 1;
    }
    i;
`);

expect ([undefined, undefined, 2], `
    var output;
    for var i in [0, 1, 2] {
        output = i;
    }
    output;
`);
expect ([undefined, 2], `
    for global i in [0, 1, 2] {}
    i;
`);
expect ([undefined, undefined, 2], `
    var output;
    for i in [0, 1, 2] {
        output = i;
    }
    output;
`);
expect ([0, undefined, 3], `
    var sum = 0;
    for i in [0, 1, 2] {
        sum = sum + i;
    }
    sum;
`);
expect ([undefined, undefined, 2], `
    var output;
    for i in 3 {
        output = i;
    }
    output;
`);

expect ([undefined, 0, undefined, 0, 1], `
    var output;
    var i_ = 0;
    for i in range(3) {
        if i == 1 { break }
        output = i;
        i_ = i_ + 1;
    }
    output;
    i_;
`);
expect ([undefined, 0,  undefined, 2, 2], `
    var output;
    var i_ = 0;
    for i in range(3) {
        if i == 1 { 
            continue 
        }
        output = i;
        i_ = i_ + 1;
    }
    output;
    i_;
`);

// old syntax now invalid
expect ('InvalidSyntaxError', `
    for (let i in 3)
        let output = i;
`);
expect ('InvalidSyntaxError', `
    for (let i in 3) {}
`);
expect ('InvalidSyntaxError', `
    while (1)
    	output = i;
`);