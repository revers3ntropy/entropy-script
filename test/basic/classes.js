import {expect, file} from '../testFramework.js';
file('basic/classes');

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
expect(['<Type: parentClass>', '<Type: childClass>', 'childClass', 2, 3], `
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
`);
expect(['<Type: parentClass>', '<Type: childClass>', '<Type: grandChildClass>', 'grandChildClass', 2, 3, 4], `
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
`);
expect(['<Type: parentClass>', '<Type: childClass>', '<Type: grandChildClass>', '<Type: greatGrandChildClass>', 'greatGrandChildClass', 2, 3, 4, 5], `
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
`);