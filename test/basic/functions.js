import {expect} from '../testFramework.js';

expect(['<Func: myFunc>', 1], `
var myFunc = func () {
    let a = 2 - 1;
    return a;
};
myFunc();
`);


// callbacks
expect(['<Func: myFunc>', 1], `
var myFunc = func (cb) {
    return cb();
};
myFunc(func () {
    return 1;
});
`);


// recursion
expect(['<Func: myFunc>', 3], `
var myFunc = func (n) {
    if n < 4 { return n }
    return myFunc(n-1);
};
myFunc(10);
`);

// Yield keyword
expect(['<Func: myFunc>', 1], `
var myFunc = func () {
    yield 1;
};
myFunc();
`);
expect(['<Func: myFunc>', undefined], `
var myFunc = func () {
    yield 0;
};
myFunc();
`);
expect(['<Func: myFunc>', 2], `
var myFunc = func () {
    yield 0;
    yield [];
    return 2;
};
myFunc();
`);
expect(['<Func: myFunc>', 'hi'], `
var myFunc = func () {
    yield 'hi';
    return 2;
};
myFunc();
`);
expect(['<Func: myFunc>', undefined], `
var myFunc = func () {
    return;
    return 2;
};
myFunc();
`);

expect(['<Func: myFunc>', 4], `
var myFunc = func (n, cb) {
    while !cb(n) {
        n = n - 1;
    }
    return n;
};
myFunc(20, func (n) {
    return n < 5;
});
`);
expect(['<Func: myFunc>', '<Func: myOtherFunc>', 1], `
var myFunc = func (cb) {
    return cb();
};

var myOtherFunc = func () {
    let a = 1;
    return myFunc(func () {
        return a;
    });
};
myOtherFunc();
`);
expect(['<Func: myFunc>', 0], `
var myFunc = func (arr) {
    for var n in arr {
        return n;
    }
};
myFunc([0, 1, 2, 3]);
`);
expect(['<Func: myFunc>', 3], `
var myFunc = func (arr, cb) {
    for var n in arr {
        if (cb(n)) {
            return n;
        }
    }
};
myFunc([0, 1, 2, 3], func (n) {
    return n == 3;
});
`);
expect(['<Func: myFunc>', 2], `
var myFunc = func () {
    return [0, 1, [0, 2]];
};
myFunc()[2][1];
`);
expect(['<Func: myFunc>', 'hi'], `
var myFunc = func () {
    return args[0];
};
myFunc('hi', 1, 2);
`);
expect(['<Func: myFunc>', undefined], `
var myFunc = func (arg) {
    return arg;
};
myFunc();
`);

expect(['<Func: myFunc>', 'hello world'], `
var myFunc = func (str1, str2, str3) {
    return str1 + str2 + str3;
};
myFunc('hel', 'lo w', 'orld');
`);

expect(['<Func: airport>'], `
global airport = func () {
    var exists = false;
    gg = false;
    // wont get logged as not running function
    log('hi');
};
`);

// different ways of returning on one line
expect(['<Func: myFunc>', 'hi'], `
    const myFunc = func () { return 'hi' };
    myFunc();
`);
expect(['<Func: myFunc>', 'hi'], `
    const myFunc = func () { 'hi' };
    myFunc();
`);
expect(['<Func: myFunc>', 'hi'], `
    const myFunc = func () 'hi';
    myFunc();
`);
expect(['<Func: myFunc>', 'hi'], `
    const myFunc = func(n)n;
    myFunc('hi');
`);

// Closures
expect(['<Func: wrapper>', '<Func: (anon)>', 'hiii'], `
    const wrapper = func (function) {
        var a = 'hiii';
        return func () a;
    };
    wrapper();
    wrapper()();
`);

expect(['<Func: wrapper>', 'hello world'], `
    const wrapper = func (fn) {
        let str1 = 'hello';
        return fn(func () {
            const str2 = ' world';
            return func () str1 + str2;
        });
    };
    
    wrapper(func (v) v()());
`);