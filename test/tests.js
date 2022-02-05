import { expect } from "./testFramework.js";

// maths logic
expect([1.99], '1.99');
expect([2], '1+1');
expect([2], '1   + 1  ');
expect([22], '2 + 4 * 5');
expect([30], '(2+4) * 5');
expect([19], '3 + 4 ^ 2');


// global constants
expect([true], 'true');
expect([false], 'false');
expect([undefined], 'nil');


// boolean logic
expect([false], '2==1');
expect([true], '2==2');
expect([false], '2!=2');
expect([false], '2 == 4 || 3 == 2');
expect([true], '2 + 2 == 4 || 3 + 2 == 2');
expect([false], '2 + 2 == 4 && 3 + 2 == 2');
expect([true], 'true && 3 - 1 == 2');
expect([true], '!false');
expect([true], '"hi" == "hi"');
expect([true], '"hi" != "hijj"');


// multi-line statements
expect([true, false], '2==2; 2==5');


// strings
expect(['a', 'bc', 'defg'], '"a"; `bc`; \'defg\'');
expect([`h'h`], `'h\\'h'`);


// variables
expect('InvalidSyntaxError', 'var a = 1; a = 2; var a = 1;');
expect('ReferenceError', 'a');
expect([1], 'global a = 1');
expect([1], 'a = 1');
expect([undefined], 'var a;');
expect([1, 2], 'var a = 1; a = a + 1;');
expect('ReferenceError', 'var a = a + 1;');
expect([undefined, true], 'var a; a == nil;');
expect([1, 2], `let n = 1; n = 2;`);
expect('TypeError', `const n = 1; n = 2;`);
expect('InvalidSyntaxError', `const n = 1; const n = 2;`);

expect(['aa', 'bb', true, undefined, false], `
let a = 'aa';
let b = 'bb';
let res = true;
if a == 'aa' && b != 'cc' {    
    res = false; 
}
res;
`);


// maths assign
expect([1, 2], `
    var n = 1;
    n += 1;
`);
expect([1, 50], `
    var n = 1;
    n *= 50;
`);
expect([6, 2], `
    var n = 6;
    n /= 3;
`);
expect(['hello', 'hello world'], `
    var n = 'hello';
    n += ' world';
`);


// if
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


// while
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

// assignment
expect(['hi'], `
    let global const a = 'hi';
`);
expect('TypeError', `
    var global const a = 'hi';
    a = 1;
`);
expect('TypeError', `
    var local const a = 'hi';
    a = 1;
`);
expect('InvalidSyntaxError', `
    var local mutable a = 'hi';
    let a = 1;
`);
expect(['hi', 1], `
    var local mutable a = 'hi';
    a = 1;
`);
expect('InvalidSyntaxError', `
    let a += 1;
`);

// arrays
expect([[0, 1, 2]], `
    [0, 1, 2];
`);
expect([[[6, 8], 1, [8, 9]]], `
    [[6, 8], 1, [8, 9]];
`);
expect([[0, 1, 2], 1], `
    var arr = [0, 1, 2];
    arr[1];
`);
expect([[[1, 2], 1, 2], 2], `
    var arr = [[1, 2], 1, 2];
    arr[0][1];
`);
expect([[0, 1, 2], 2, [0, 2, 2]], `
    var arr = [0, 1, 2];
    arr[1] = 2;
    arr;
`);
expect([[[1, 2], 1, 2], 5, [[1, 5], 1, 2]], `
    var arr = [[1, 2], 1, 2];
    arr[0][1] = 5;
    arr;
`);
expect([{a:1}, 2], `
    n = {a: 1};
    n.a += 1;
`);
expect('TypeError', `
    n = 0;
    n.n = 1;
`);


// for
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

// break & continue
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
        if i == 1 { continue }
        output = i;
        i_ = i_ + 1;
    }
    output;
    i_;
`);

// range
expect([[0, 1, 2]], 'range(3)');
expect ([undefined, 2], `
    for global i in range(3) {}
    i;
`);


// comments
expect([], '');
expect([], '// hiii');
expect([1], '// hiii \n 1');
expect([2], '1 + // hiii \n 1');

// functions
expect(['<Func: myFunc>', 1], `
var myFunc = func () {
    return 1;
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
// yield
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

// nesting
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


// objects + properties
expect([{}, 1, 1, 1], `
    var a = {};
    a['a'] = 1;
    a.a;
    a['a'];
`);
expect([{}, 1, 1, 1], `
    var a = {};
    a.a = 1;
    a.a;
    a['a'];
`);
expect([{a: {}}, 6, 6, 6, 6, 6], `
    var a = {a: {}};
    a.a.a = 6;
    a.a.a;
    a['a'].a;
    a.a['a'];
    a['a']['a'];
`);
expect([{a: 1}, 1], `
    var a = {a: 1};
    a.a;
`);
expect([{a: 1}, 1, 1], `
    var a = {'a': 1};
    a['a'];
    a.a;
`);
expect(['a', {a: 1}, 1, 1], `
    var b = 'a';
    var a = {[b]: 1};
    a['a'];
    a.a;
`);
expect([{a: '<Func: (anon)>'}, '<Func: (anon)>', 'e'], `
    var a = {a: func () {
        return 'hello world';
    }};
    a.a;
    a.a()[1];
`);

// classes
expect(['<Type: myClass>'], `
    var myClass = class {
        init () {}
        publicFunction () {}
    };
`);
expect(['<Type: myClass>'], `
    var myClass = class {
        init (a) {
            this.a = a;
        }
    };
`);
expect(['<Type: myClass>', 'myClass', 3], `
    var myClass = class {
        init (a) {
            this.a = a;
        }
    };
    
    var myInstance = myClass(3);
    myInstance.a;
`);

expect(['<Type: myClass>', 'myClass', 3, undefined, 5], `
    var myClass = class {
        init (a) {
            this.a = a;
        }
        
        setA (a) {
            this.a = a;
        }
    };
    
    var myInstance = myClass(3);
    myInstance.a;
    myInstance.setA(5);
    myInstance.a;
`);

expect(['<Type: myClass>', 'myClass', 3, undefined, 10], `
    var myClass = class {
        init (a) {
            this.a = a;
        }
        
        setA (a) {
            this.a = a;
        }
        
        doThing () {
            this.setA(10);
        }
    };
    
    var myInstance = myClass(3);
    myInstance.a;
    myInstance.doThing();
    myInstance.a;
`);
expect(['<Type: myClass>', 'myClass', 3, 'myClass', true, false, false], `
    var myClass = class {
        init (a) {
            this.a = a;
        }
        
        getThis () {
            return this;
        }
    };
    
    var myInstance = myClass(3);
    myInstance.a;
    var this_ = myInstance.getThis();
    this_ == myInstance;
    this_ == myClass(3);
    myInstance == myClass(3);
`);
expect(['<Type: parentClass>', '<Type: childClass>', 'childClass', 2, 3, 'childClass'], `
    var parentClass = class {
        init (a) {
            this.a = a;
        }
    };
    var childClass = class extends parentClass {
        init (a, b) {
            super(a);
            this.b = b;
        }
    };
    var instance = childClass(2, 3);
    instance.a;
    instance.b;
    instance.constructor.name;
`);
expect(['<Type: parentClass>', '<Type: childClass>', '<Type: grandChildClass>', 'grandChildClass', 2, 3, 4, 'grandChildClass'], `
    var parentClass = class {
        init (a) {
            this.a = a;
        }
    };
    var childClass = class extends parentClass {
        init (a, b) {
            super(a);
            this.b = b;
        }
    };
    var grandChildClass = class extends childClass {
        init (a, b, c) {
            super(a, b);
            this.c = c;
        }
    };
    var instance = grandChildClass(2, 3, 4);
    instance.a;
    instance.b;
    instance.c;
    instance.constructor.name;
`);
expect(['<Type: parentClass>', '<Type: childClass>', '<Type: grandChildClass>', '<Type: greatGrandChildClass>', 'greatGrandChildClass', 2, 3, 4, 5, 'greatGrandChildClass'], `
    var parentClass = class {
        init (a) {
            this.a = a;
        }
    };
    var childClass = class extends parentClass {
        init (a, b) {
            super(a);
            this.b = b;
        }
    };
    var grandChildClass = class extends childClass {
        init (a, b, c) {
            super(a, b);
            this.c = c;
        }
    };
    var greatGrandChildClass = class extends grandChildClass {
        init (a, b, c, d) {
            super(a, b, c);
            this.d = d;
        }
    };
    
    var instance = greatGrandChildClass(2, 3, 4, 5);
    instance.a;
    instance.b;
    instance.c;
    instance.d;
    instance.constructor.name;
`);


// --- TYPING ---

// assignment
expect([10, 10], `
    let a: number = 10;
    a;
`);
expect('TypeError', `
    const a: number = 'hi';
`);
expect(['<Type: myClass>', 'myClass', 'myClass'], `
    const myClass = class {};
    let a = myClass();
    let b: myClass = a;
`);
expect('TypeError', `
    const myClass = class {};
    let b: myClass = 1;
`);
expect('TypeError', `
    let b: string = func () 0;
`);
expect('TypeError', `
    let b: number = ['hi'];
`);
expect('TypeError', `
    let b: string = nil;
`);

// functions
expect(['<Func: f>', 'hello world'], `
    const f = func (a: string, b: string) {
        return a + b;
    };
    f('hello', ' world');
`);
expect(['<Func: f>', 21], `
    const f = func (x: number){
        return 2 * x + 1;
    };
    f(10);
`);
expect('TypeError', `
    const f = func (x: number) {
        return 2 * x + 1;
    };
    f([10]);
`);
expect(['<Func: append_>', [10]], `
    const append_ = func (a: array, item: any): array {
        a.add(item);
        return a;
    };
    append_([], 10);
`);
expect('TypeError', `
    const append_ = func (a: array, item: any): number {
        a.add(item);
        return a;
    };
    append_([], 10);
`);
expect(['<Type: Concatenator>', 'Concatenator', 'hello world'], `
    const Concatenator = class {
        init (str1: string) {
            this.str = str1;
        }
        
        concat (str2: string): string {
            return this.str + str2;
        }
    };
    
    const concat = Concatenator('hello ');
    concat.concat('world');
    
`);
expect('TypeError', `
    const Concatenator = class {
        init (str1: string) {
            this.str = str1;
        }
    };
    const concat = Concatenator(12);
`);

// parse num built in function
expect([1], 'parseNum("1")');
expect([1.1], 'parseNum("1.1")');
expect([1.1], 'parseNum(1.1)');

// built in types
expect(['Number'], 'type(1.1)');
expect(['Type'], 'type(type)');
expect(['Type'], 'type(number)');
expect([undefined], 'type()');
expect(['Function'], 'type(parseNum)');
expect(['String'], 'type("hi")');
expect(['Object'], 'type({a: 3})');
expect(['Array'], 'type([1, 2, 3])');
expect([1.2], 'number(1.2)');
expect([['1.2']], 'array(`1.2`)');
expect(['5'], 'string(5)');

// More functions
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


// vector library
expect(['<Type: v2>', 'v2', 'v2', '3, 4', 'v2', '8, 10', false, 'v2', '8, 10', '9, 11'], `
    const v2 = class {
        init (x: number, y: number) {
            this.x = x;
            this.y = y;
        }
        
        add (v: any): any {
            this.x += v.x;
            this.y += v.y;
            return this;
        }
        
        scale (n: number): any {
            this.x *= n;
            this.y *= n;
            return this;
        }
       
        clone (): any {
            return v2(this.x, this.y);
        }
        
        str (): string {
            return this.x.str() + ', ' + this.y.str();
        }
    };
    
    var pos = v2(0, 0);
    pos.add(v2(3, 4));
    pos.str();
    pos.add(v2(1, 1)).scale(2);
    pos.str();
    pos.clone() == pos;
    var clone = pos.clone().add(v2(1, 1));
    pos.str();
    clone.str();
`);

// Namespaces / modules
expect([{}], `
    const MyLib = namespace {};
`);
expect([{a: '<Symbol: a>'}, 'hi'], `
    global const MyLib = namespace {
        const a = 'hi';
    };
   MyLib.a;
`);
expect('TypeError', `
    global const MyLib = namespace {
        const a: number = 0;
    };
   MyLib.a = 1;
`);
expect([{a: '<Symbol: a>'}, 1, 1], `
    global MyLib = namespace {
        mutable a: number = 0;
    };
   MyLib.a = 1;
   MyLib['a'];
`);
expect([{myClass: '<Symbol: myClass>', myFunc: '<Symbol: myFunc>', a: '<Symbol: a>'}, '<Type: myClass>', 'myClass', 123, 'Hello world!'], `
    global const MyLib = namespace {
        const myClass = class {
            init () {
                this.thing = 123;
            }
        };
    
        const myFunc = func (obj: myClass) {
            return obj.thing;
        };
    
        const a = 'Hello world!';
    };
    
    let myType = MyLib.myClass;
    let const instance: myType = MyLib.myClass();
    MyLib.myFunc(instance);
    MyLib.a;
`);

expect([undefined, 1], `
    using(namespace {
        mutable a: number = 1;
    });
    a;
`);

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

expect([], `
	const lib = import('./imports/lib/main.es');
	
	const main = func () {
		return lib.goThing();
	};
	
	main();
`);