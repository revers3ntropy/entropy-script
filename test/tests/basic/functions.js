const {expect, file} = require( '../../testFramework');
file('basic/functions');

expect(['<Func>', 1], `
let myFunc = func () {
    let a = 2 - 1;
    return a;
};
myFunc();
`);


// callbacks
expect(['<Func>', 1], `
let myFunc = func (cb) {
    return cb();
};
myFunc(func () {
    return 1;
});
`);


// recursion
expect(['<Func>', 3], `
let myFunc = func (n) {
    if n < 4 { return n }
    return myFunc(n-1);
};
myFunc(10);
`);

// Yield keyword
expect(['<Func>', 1], `
let myFunc = func () {
    yield 1;
};
myFunc();
`);
expect(['<Func>', undefined], `
let myFunc = func () {
    yield 0;
};
myFunc();
`);
expect(['<Func>', 2], `
let myFunc = func () {
    yield 0;
    yield [];
    return 2;
};
myFunc();
`);
expect(['<Func>', 'hi'], `
let myFunc = func () {
    yield 'hi';
    return 2;
};
myFunc();
`);
expect(['<Func>', undefined], `
let myFunc = func () {
    return;
    return 2;
};
myFunc();
`);

expect(['<Func>', 4], `
let myFunc = func (n, cb) {
    while !cb(n) {
        n = n - 1;
    }
    return n;
};
myFunc(20, func (n) {
    return n < 5;
});
`);
expect(['<Func>', '<Func>', 1], `
let myFunc = func (cb) {
    return cb();
};

let myOtherFunc = func () {
    let a = 1;
    return myFunc(func () {
        return a;
    });
};
myOtherFunc();
`);
expect(['<Func>', 0], `
let myFunc = func (arr) {
    for n in arr {
        return n;
    }
};
myFunc([0, 1, 2, 3]);
`);
expect(['<Func>', 3], `
let myFunc = func (arr, cb) {
    for n in arr {
        if (cb(n)) {
            return n;
        }
    }
};
myFunc([0, 1, 2, 3], func (n) {
    return n == 3;
});
`);
expect(['<Func>', 2], `
let myFunc = func () {
    return [0, 1, [0, 2]];
};
myFunc()[2][1];
`);
expect(['<Func>', 'hi'], `
let myFunc = func () {
    return args[0];
};
myFunc('hi', 1, 2);
`);
expect(['<Func>', undefined], `
let myFunc = func (arg) {
    return arg;
};
myFunc(nil);
`);

expect(['<Func>', 'hello world'], `
let myFunc = func (str1, str2, str3) {
    return str1 + str2 + str3;
};
myFunc('hel', 'lo w', 'orld');
`);

expect(['<Func>'], `
let myFunc = func () {
	let exists = false;
	gg = false;
	// wont get logged as not running function
	log('hi');
};
`);

// different ways of returning on one line
expect(['<Func>', 'hi'], `
    let myFunc = func () { return 'hi' };
    myFunc();
`);
expect(['<Func>', 'hi'], `
    let myFunc = func () { 'hi' };
    myFunc();
`);
expect(['<Func>', 'hi'], `
    let myFunc = func () 'hi';
    myFunc();
`);
expect(['<Func>', 'hi'], `
    let myFunc = func(n)n;
    myFunc('hi');
`);

// Closures
expect(['<Func>', '<Func>', 'hiii'], `
    let wrapper = func () {
        let a = 'hiii';
        return func () a;
    };
    wrapper();
    wrapper()();
`);

expect(['<Func>', 'hello world'], `
    let wrapper = func (fn) {
        let str1 = 'hello';
        return fn(func () {
            let str2 = ' world';
            return func () str1 + str2;
        });
    };
    
    wrapper(func (v) v()());
`);