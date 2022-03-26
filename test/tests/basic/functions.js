const {expect, file} = require( '../../testFramework');
file('basic/functions');

expect(['<Func>'], `
func () {};
`);

expect(['<Func>'], `
let myFunc = func () {};
`);

expect(['<Func>'], `
func myFunc () {};
`);

expect(['<Func>', 1], `
func myFunc () {
    return 1;
};
myFunc();
`);

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

expect('InvalidSyntaxError', `
func (a, a) {};
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
// #10
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

// #20
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

// Default arguments

expect(['<Func>', 1, 3], `
    func myFunc (a=1): Number {
        return a;
    };
    myFunc();
    myFunc(3);
`);

expect(['<Func>', 1, 3], `
    func myFunc (a: Number = 1): Number {
        return a;
    };
    myFunc();
    myFunc(3);
`);

// #30
expect('TypeError', `
    func myFunc (a: Number = 'hi'): Number {
        return a;
    };
    myFunc();
    myFunc(3);
`);

expect('TypeError', `
    func myFunc (a: Number = 2): Number {
        return a;
    };
    myFunc('hi');
`);

expect('InvalidSyntaxError', `
    func myFunc (a: Number = 2, b): Number {
        return a;
    };
    myFunc('hi');
`);

expect('InvalidSyntaxError', `
    func myFunc (a, b: Number = 2, c: ?String): Number {
        return [a, b];
    };
    myFunc('hi');
`);

expect('InvalidSyntaxError', `
    func myFunc (b, b: Number = 2, c: ?String): Number {
        return a;
    };
    myFunc('hi');
`);

// kwargs
expect('InvalidSyntaxError', `
    func myFunc (*b, c) nil;
`);

expect('InvalidSyntaxError', `
    func myFunc (*b, a=2) nil;
`);

expect('InvalidSyntaxError', `
    func myFunc (*a, a=2) nil;
`);

expect('InvalidSyntaxError', `
    func myFunc (a, *a) nil;
`);

// #40
expect(['<Func>', [1, 2]], `
    func myFunc (*) {
        return args;
    };
    
    myFunc(1, 2);
`);
expect(['<Func>', {a: 2}], `
    func myFunc (**) {
        return [kwargs];
    };
    
    myFunc(a=2);
`);
expect(['<Func>', [[1, 2], {a: 2}]], `
    func myFunc (*, **) {
        return [args, kwargs];
    };
    
    myFunc(1, 2, a=2);
`);

expect(['<Func>', [1, 3, [1, 2], {a: 2, b: 3}]], `
    func myFunc (a, *b, *, **) {
        return [a, b, args, kwargs];
    };
    
    myFunc(1, 2, a=2, b=3);
`);

expect('', `
    func myFunc (a, *b, *) {
        return [a, b, args, kwargs];
    };
    
    myFunc(1, 2, a=2, b=3);
`);

expect(['<Func>', {a: 2, b: 3}], `
    func myFunc (**) {
        return kwargs;
    };
    
    myFunc(a=2, b=3);
`);

expect(['<Func>', [1, 3, [1, 2], {a: 2, b: 3}]], `
    func myFunc (a: Number, *b: Number, *, **) {
        return [a, b, args, kwargs];
    };
    
    myFunc(1, 2, *a=2, *b=3);
`);