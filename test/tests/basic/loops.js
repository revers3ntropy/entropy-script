const {expect, file} = require( '../../testFramework');
file('basic/loops');

expect([undefined, 0, undefined, 9, 10], `
    let var output;
    let var i = 0;
    for i < 10 {
        output = i;
        i = i + 1;
    }
    output; i;
`);
expect([0, undefined, 10], `
    let var i = 0;
    for i < 10 {
        i = i + 1;
    }
    i;
`);

expect ([undefined, undefined, 2], `
    let var output;
    for i = [0, 1, 2] {
        output = i;
    }
    output;
`);

expect ('InvalidSyntaxError', `
    for global i in [] {}
`);
expect ([undefined, undefined, 2], `
    let var output;
    for i = [0, 1, 2] {
        output = i;
    }
    output;
`);
expect ([0, undefined, 3], `
    let var sum = 0;
    for i = [0, 1, 2] {
        sum = sum + i;
    }
    sum;
`);
expect ([undefined, undefined, 2], `
    let var output;
    for i = 3 {
        output = i;
    }
    output;
`);

expect ([undefined, 0, undefined, 0, 1], `
    let var output;
    let var i_ = 0;
    for i = range(3) {
        if i == 1 { break; }
        output = i;
        i_ = i_ + 1;
    }
    output;
    i_;
`);
expect ([undefined, 0,  undefined, 2, 2], `
    let var output;
    let var i_ = 0;
    for i = range(3) {
        if i == 1 { 
            continue;
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
    for (let i = 3)
        let output = i;
`);
expect ('InvalidSyntaxError', `
    for (i = 3)
        let output = i;
`);
expect ('InvalidSyntaxError', `
    for (i in 3)
        let output = i;
`);
expect ('InvalidSyntaxError', `
    for (let i in 3) {}
`);
expect ('InvalidSyntaxError', `
    for (1)
    	output = i;
`);

// iterator override
expect (['Iter', [], undefined, [4, 3, 2, 1, 0]], `
    class Iter {
        a;
    	init() {
    		this.a = 5;
    	}
    	
    	__iter__ () {
    		return this;
    	}
    	
    	__next__ () {
    		if this.a > 0 {
    			this.a -= 1;
    			return this.a;
			}
			return EndIterator();
    	}
    };
    let var nums = [];
    for i = Iter() {
    	nums += [i];
    }
    nums;
`);