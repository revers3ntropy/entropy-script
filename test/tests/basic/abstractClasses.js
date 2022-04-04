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

expect(['A', 'B', 'something1'], `
    abstract class A {
        thing: Num;
        name: Str;
        
        init (name: Str) {
            this.name = name;
        }
        
        speak: func (*, **) Any;
    };
    class B extends A {
        init () {
            super('something');
            this.thing = 1;
        }
        
        speak (level = 1) {
            return this.name + level.str();
        }
    };
    B().speak();
`);

expect('TypeError', `
    abstract class A {
        name: Str;
        
        init (name: Str) {
            this.name = name;
        }
        
        speak: func (*, **) Any;
    };
    class B extends A {
        init () {
            super('something');
            this.thing = 1;
        }
        
        speak (level=1): Str {
            return this.name + level.str();
        }
    };
    B();
`);

expect('TypeError', `
    abstract class A {
        thing: Str;
        name: Str;
        
        init (name: Str) {
            this.name = name;
        }
        
        speak: func (*, **) Any;
    };
    class B extends A {
        init () {
            super('something');
            this.thing = 1;
        }
        
        speak (level=1): Str {
            return this.name + level.str();
        }
    };
    B();
`);

expect('TypeError', `
    abstract class A {
        thing: Num;
        name: Str;
        
        init (name: Str) {
            this.name = name;
        }
        
        speak: func () Any;
    };
    class B extends A {
        init () {
            super('something');
            this.thing = 1;
        }
        
        speak (level=1): Str {
            return this.name + level.str();
        }
    };
    B();
`);

expect('TypeError', `
    abstract class A {
        thing: Num;
        name: Str;
        
        init (name: Str) {
            this.name = name;
        }
        
        speak: func (*, **) Any;
    };
    class B extends A {
        init () {
            super('something');
            this.thing = 1;
        }
    };
    B();
`);
expect('TypeError', `
    abstract class A {
        thing: Num;
        name: Str;
        
        init (name: Str) {
            this.name = name;
        }
        
        speak: func (*, **) Any;
    };
    class B extends A {
        init () {
            super('something');
        }
        
        speak (level=1): Str {
            return this.name + level.str();
        }
    };
    B();
`);
expect('TypeError', `
    abstract class A {
        thing: Num;
        name: Str;
        
        init (name: Str) {
            this.name = name;
        }
        
        speak: func (*, **) Any;
    };
    class B extends A {
        init () {
            super(2);
            this.thing = 1;
        }
        
        speak (level=1): Str {
            return this.name + level.str();
        }
    };
    B();
`);
expect('TypeError', `
    abstract class A {
        thing: Num;
        name: Str;
        
        init (name: Str) {
            this.name = name;
        }
        
        speak: func (**) Any;
    };
    class B extends A {
        init () {
            super('something');
            this.thing = 1;
        }
        
        speak (level=1): Str {
            return this.name + level.str();
        }
    };
    B();
`);
expect('TypeError', `
    abstract class A {
        thing: Num;
        name: Str;
        
        init (name: Str) {
            this.name = name;
        }
        
        speak_: func (*, **) Any;
    };
    class B extends A {
        init () {
            super('something');
            this.thing = 1;
        }
        
        speak (level=1): Str {
            return this.name + level.str();
        }
    };
    B();
`);
expect('TypeError', `
    abstract class A {
        thing: Num;
        name: Str;
        
        init (name: Str) {
            this.name = name;
        }
        
        speak: func (*, **) Any;
    };
    class B extends A {
        init () {
            super('something');
            this.thing = 1;
        }
        
        speak (level=1): Str {
            return this.name + level.str();
        }
    };
    B();
`);