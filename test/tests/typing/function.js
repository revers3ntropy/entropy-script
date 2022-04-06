const {expect, file} = require( '../../testFramework');
file('typing/function');

expect(['<Func>', 'hi'], `
    let myFunc: (func () Str) = func (): Str 'hi';
    myFunc();
`);

expect(['<Func>', 'hi'], `
    let myFunc: (func () Str) = func () 'hi';
    myFunc();
`);

expect(['<Func>', 1], `
    let myFunc: (func () Str) = func () 1;
    myFunc();
`);

expect('TypeError', `
    let myFunc: (func () Str) = func (): Num 1;
    myFunc();
`);

expect(['<Func>'], `
    let myFunc: (func () Any) = func (): Any 1;
`);

expect(['<Func>'], `
    let myFunc: (func () Any) = func (): Num 1;
`);

expect('TypeError', `
    let myFunc: (func (c) Any) = func (): Num 1;
`);

expect(['<Func>'], `
    let myFunc: (func (*, **) Any) = func (): Num 1;
`);

expect(['<Func>'], `
    let myFunc: (func (*, **) Any) = func (c, *d): Num 1;
`);

expect(['<Func>'], `
    let myFunc: (func (*, **) Any) = func (c, *d, *, **): Num 1;
`);

expect(['<Func>'], `
    let myFunc: (func (*) Any) = func (c, d: Num, e: Str): Num 1;
`);

expect('TypeError', `
    let myFunc: (func (*) Any) = func (*c): Num 1;
`);

expect('TypeError', `
    let myFunc: (func (*) Any) = func (*, **): Num 1;
`);

expect('TypeError', `
    let myFunc: (func () Any) = func (*): Num 1;
`);

expect(['<Func>'], `
    let myFunc: (func () Str) = func (): ('hi' | 'hello') 'hi';
`);
expect(['<Func>'], `
    let myFunc: (func () Str) = func (): ('hi') 'hi';
`);
expect('TypeError', `
    let myFunc: (func () Num) = func (): (1 | 'hi') 1;
`);
expect('TypeError', `
    let myFunc: (func () Str) = func (): (1 | 'hi') 1;
`);
expect(['<Func>'], `
    let myFunc: (func () ~Str) = func (): Num 1;
`);
expect('TypeError', `
    let myFunc: (func () ~Str) = func (): Str '';
`);
expect('TypeError', `
    let myFunc: (func () ~Str) = func (): (Str | Num) '';
`);
expect('TypeError', `
    let myFunc: (func () ~Str) = func (): ('string' | 2) 'string';
`);
expect(['<Func>'], `
    let myFunc: (func () func () Any) = func (): (func () Any) func () func () 0;
`);
expect(['<Func>'], `
    // my god what
    let myFunc: (func () func (c: Any) Any) = func (): (func (c: Str) Any) func (c: Str) func () 0;
`);
expect(['A', 'B', '<Func>'], `
    class A {};
    class B extends A {};
    let myFunc: (func () A) = func (): B B();
`);
expect('TypeError', `
    class A {};
    class B extends A {};
    let myFunc: (func () B) = func (): A A();
`);