const {expect, file} = require( '../../testFramework');
file('basic/functions');

expect(['<Func>'], `
func () {};
`);

expect(['<Func>'], `
let my_func = func () {};
`);

expect(['<Func>'], `
func my_func () {};
`);

expect(['<Func>', 1], `
func my_func () {
    return 1;
};
my_func();
`);

expect(['<Func>', 1], `
let my_func = func () {
    let a = 2 - 1;
    return a;
};
my_func();
`);


// callbacks
expect(['<Func>', 1], `
let my_func = func (cb) {
    return cb();
};
my_func(func () {
    return 1;
});
`);

expect('InvalidSyntaxError', `
func (a, a) {};
`);

expect([1], `
(func () 1)();
`);

expect([1], `
(func () func () {
    return 1;
})()();
`);

// recursion
expect(['<Func>', 3], `
let my_func = func (n) {
    if n < 4 { return n }
    return my_func(n-1);
};
my_func(10);
`);

// Yield keyword
expect(['<Func>', 1], `
let my_func = func () {
    yield 1;
};
my_func();
`);
expect(['<Func>', undefined], `
let my_func = func () {
    yield 0;
};
my_func();
`);
// #10
expect(['<Func>', 2], `
let my_func = func () {
    yield 0;
    yield [];
    return 2;
};
my_func();
`);
expect(['<Func>', 'hi'], `
let my_func = func () {
    yield 'hi';
    return 2;
};
my_func();
`);
expect(['<Func>', undefined], `
let my_func = func () {
    return;
    return 2;
};
my_func();
`);

expect(['<Func>', 4], `
let my_func = func (n, cb) {
    for !cb(n) {
        n = n - 1;
    }
    return n;
};
my_func(20, func (n) {
    return n < 5;
});
`);
expect(['<Func>', '<Func>', 1], `
let my_func = func (cb) {
    return cb();
};

let myOtherFunc = func () {
    let a = 1;
    return my_func(func () {
        return a;
    });
};
myOtherFunc();
`);
expect(['<Func>', 0], `
let my_func = func (arr) {
    for n = arr {
        return n;
    }
};
my_func([0, 1, 2, 3]);
`);
expect(['<Func>', 3], `
let my_func = func (arr, cb) {
    for n = arr {
        if (cb(n)) {
            return n;
        }
    }
};
my_func([0, 1, 2, 3], func (n) {
    return n == 3;
});
`);
expect(['<Func>', 2], `
let my_func = func () {
    return [0, 1, [0, 2]];
};
my_func()[2][1];
`);
expect(['<Func>', undefined], `
let my_func = func (arg) {
    return arg;
};
my_func(nil);
`);

// #20
expect(['<Func>', 'hello world'], `
let my_func = func (str1, str2, str3) {
    return str1 + str2 + str3;
};
my_func('hel', 'lo w', 'orld');
`);

expect(['<Func>'], `
let my_func = func () {
	let exists = false;
	gg = false;
	// wont get logged as not running function
	log('hi');
};
`);

// different ways of returning on one line
expect(['<Func>', 'hi'], `
    let my_func = func () { return 'hi' };
    my_func();
`);
expect(['<Func>', 'hi'], `
    let my_func = func () { 'hi' };
    my_func();
`);
expect(['<Func>', 'hi'], `
    let my_func = func () 'hi';
    my_func();
`);
expect(['<Func>', 'hi'], `
    let my_func = func(n)n;
    my_func('hi');
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
    func my_func (a=1): Num {
        return a;
    };
    my_func();
    my_func(3);
`);

expect(['<Func>', 1, 3], `
    func my_func (a: Num = 1): Num {
        return a;
    };
    my_func();
    my_func(3);
`);

// #30
expect('TypeError', `
    func my_func (a: Num = 'hi'): Num {
        return a;
    };
    my_func();
    my_func(3);
`);

expect('TypeError', `
    func my_func (a: Num = 2): Num {
        return a;
    };
    my_func('hi');
`);

expect('InvalidSyntaxError', `
    func my_func (a: Num = 2, b): Num {
        return a;
    };
    my_func('hi');
`);

expect('InvalidSyntaxError', `
    func my_func (a, b: Num = 2, c: ?Str): Num {
        return [a, b];
    };
    my_func('hi');
`);

expect('InvalidSyntaxError', `
    func my_func (b, b: Num = 2, c: ?Str): Num {
        return a;
    };
    my_func('hi');
`);

// kwargs
expect('InvalidSyntaxError', `
    func my_func (*b, c) nil;
`);

expect('InvalidSyntaxError', `
    func my_func (**, *) nil;
`);

expect('InvalidSyntaxError', `
    func my_func (*b, a=2) nil;
`);

expect('InvalidSyntaxError', `
    func my_func (*a, a=2) nil;
`);

expect('InvalidSyntaxError', `
    func my_func (a, *a) nil;
`);
expect(['<Func>', [1, 2]], `
    func my_func (*) args;
    my_func(1, 2);
`);

// #40
expect('TypeError', `
    func my_func () {
        return args;
    };
    my_func(1, 2);
`);
expect(['<Func>', {a: 2}], `
    func my_func (**) kwargs;
    my_func(*a=2);
`);
expect(['<Func>', {a: 2, b: 3}], `
    func my_func (**) kwargs;
    my_func(*a=2, *b=3);
`);
expect(['<Func>', [[1, 2], {a: 2}]], `
    func my_func (*, **) {
        return [args, kwargs];
    };
    
    my_func(1, 2, *a=2);
`);

expect(['<Func>', [1, 4, [1, 2], {a: 3, b: 4}]], `
    func my_func (a, *b, *, **) {
        return [a, b, args, kwargs];
    };
    
    my_func(1, 2, *a=3, *b=4);
`);
expect('TypeError', `
    func my_func (a, *b, *) {
        return [a, b, args, kwargs];
    };
    
    my_func(1, 2, *a=2, *b=3);
`);
expect(['<Func>', 2, 3, {a: 2, b: 3}], `
    func my_func (**) kwargs;
    let a = 2;
    let b = 3;
    my_func(*a, *b);
`);
expect(['<Func>', [1, 3, [1, 2], {a: 2, b: 3}]], `
    func my_func (a: Num, *b: Num, *, **) 
    	[a, b, args, kwargs];
    my_func(1, 2, *a=2, *b=3);
`);
expect(['<Func>', [1, 3, [1, 2], {a: 2, b: 3}]], `
    func my_func (a: Num, *b: Num, *, **) 
    	[a, b, args, kwargs];
    	
    my_func(1, 2, **{a: 2, b: 3});
`);

expect(['<Func>', {a: 2, b: 3}, [1, 3, [1, 2], {a: 2, b: 3}]], `
    func my_func (a: Num, *b: Num, *, **) 
    	[a, b, args, kwargs];
    	
   	let a = {a: 2, b: 3};
    my_func(1, 2, **a);
`);
expect(['<Func>', [1, 2], {a: 2, b: 3}, [1, 3, [1, 2], {a: 2, b: 3}]], `
    func my_func (a: Num, *b: Num, *, **) 
    	[a, b, args, kwargs];
   	let a = [1, 2];
   	let b = {a: 2, b: 3};
    my_func(**a, **b);
`);
expect('InvalidOperationError', `
    nil();
`);
// #55
expect([undefined], `
    nil?();
`);