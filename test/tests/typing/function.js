const {expect, file} = require( '../../testFramework');
file('typing/function');

expect(['<Func>', 'hi'], `
    let my_func: (func () Str) = func (): Str 'hi';
    my_func();
`);

expect(['<Func>', 'hi'], `
    let my_func: (func () Str) = func () 'hi';
    my_func();
`);

expect(['<Func>', 1], `
    let my_func: (func () Str) = func () 1;
    my_func();
`);

expect('TypeError', `
    let my_func: (func () Str) = func (): Num 1;
    my_func();
`);

expect(['<Func>'], `
    let my_func: (func () Any) = func (): Any 1;
`);

expect(['<Func>'], `
    let my_func: (func () Any) = func (): Num 1;
`);

expect('TypeError', `
    let my_func: (func (c) Any) = func (): Num 1;
`);

expect(['<Func>'], `
    let my_func: (func (*, **) Any) = func (): Num 1;
`);

expect(['<Func>'], `
    let my_func: (func (*, **) Any) = func (c, *d): Num 1;
`);

expect(['<Func>'], `
    let my_func: (func (*, **) Any) = func (c, *d, *, **): Num 1;
`);

expect(['<Func>'], `
    let my_func: (func (*) Any) = func (c, d: Num, e: Str): Num 1;
`);

expect('TypeError', `
    let my_func: (func (*) Any) = func (*c): Num 1;
`);

expect('TypeError', `
    let my_func: (func (*) Any) = func (*, **): Num 1;
`);

expect('TypeError', `
    let my_func: (func () Any) = func (*): Num 1;
`);

expect(['<Func>'], `
    let my_func: (func () Str) = func (): ('hi' | 'hello') 'hi';
`);
expect(['<Func>'], `
    let my_func: (func () Str) = func (): ('hi') 'hi';
`);
expect('TypeError', `
    let my_func: (func () Num) = func (): (1 | 'hi') 1;
`);
expect('TypeError', `
    let my_func: (func () Str) = func (): (1 | 'hi') 1;
`);
expect('TypeError', `
    let my_func: (func () ~Str) = func (): Str '';
`);
expect('TypeError', `
    let my_func: (func () ~Str) = func (): (Str | Num) '';
`);
expect('TypeError', `
    let my_func: (func () ~Str) = func (): ('string' | 2) 'string';
`);
expect(['<Func>'], `
    let my_func: (func () func () Any) = func (): (func () Any) func () func () 0;
`);
expect(['<Func>'], `
    // my god what
    let my_func: (func () func (c: Any) Any) = func (): (func (c: Str) Any) func (c: Str) func () 0;
`);
expect(['A', 'B', '<Func>'], `
    class A {};
    class B extends A {};
    let my_func: (func () A) = func (): B B();
`);
expect('TypeError', `
    class A {};
    class B extends A {};
    let my_func: (func () B) = func (): A A();
`);
expect('TypeError', `
    let my_func: Func = 1;
`);
expect(['<Func>'], `
    let my_func: Func = func () {};
`);
expect(['<Func>'], `
    let my_func: Func = func (*, **): Any {};
`);
expect(['<Func>'], `
    let my_func: Func = func (c, *d, *, **): [Bool, Str] { [true, ''] };
`);
expect(['<Func>'], `
    let my_func: Func = func (c) c;
`);
expect(['<Func>'], `
    let my_func: Func = func (c: Func) c();
`);