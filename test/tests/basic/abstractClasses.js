const {expect, file} = require('../../testFramework');
file('basic/abstractClasses');

expect(['A'], `
    abstract class A {};
`);

expect('TypeError', `
    abstract class A {};
    A();
`);

expect('TypeError', `
    abstract class A {
        init () {}
    };
    A();
`);

expect(['A', 'B'], `
    abstract class A {};
    class B extends A {};
`);

expect(['A', 'B', {}], `
    abstract class A {};
    class B extends A {};
    B();
`);

expect(['A', 'B', 'C', {}], `
    abstract class A {};
    abstract class B extends A {};
    class C extends B {};
    C();
`);

expect('TypeError', `
    abstract class A {};
    abstract class B extends A {};
    B();
`);