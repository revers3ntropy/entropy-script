const {expect, file} = require( '../../testFramework');
file('basic/classes');

expect(['myClass'], `
    let myClass = class {
        init () {}
        publicFunction () {}
    };
`);

expect(['myClass'], `
    let myClass = class {
        init (a) {
            this.a = a;
        }
    };
`);

expect(['myClass', {a: 3}, 3], `
    let myClass = class {
        init (a) {
            this.a = a;
        }
    };
    
    let myInstance = myClass(3);
    myInstance.a;
`);

expect(['myClass', {setA: '<Func>', a: 3}, 3, 5, 5], `
    let myClass = class {
        init (a) {
            this.a = a;
        }
        
        setA (a) {
            this.a = a;
        }
    };
    
    let myInstance = myClass(3);
    myInstance.a;
    myInstance.setA(5);
    myInstance.a;
`);

expect(['myClass', {a: 3, setA: '<Func>', doThing: '<Func>'}, 3, 10, 10], `
    let myClass = class {
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
    
    let myInstance = myClass(3);
    myInstance.a;
    myInstance.doThing();
    myInstance.a;
`);
expect(['myClass', {a: 3, getThis: '<Func>'}, 3, {a: 3, getThis: '<Func>'}, true, true, true, false], `
    let myClass = class {
        init (a) {
            this.a = a;
        }
        
        getThis () {
            return this;
        }
    };
    
    let myInstance = myClass(3);
    myInstance.a;
    let this_ = myInstance.getThis();
    this_ == myInstance;
    this_ == myClass(3);
    myInstance == myClass(3);
    myInstance == myClass(4);
`);

expect(['parentClass', 'childClass', {a: 2, b: 3}, 2, 3], `
    let parentClass = class {
        init (a) {
            this.a = a;
        }
    };
    let childClass = class extends parentClass {
        init (a, b) {
            super(a);
            this.b = b;
        }
    };
    
    let instance = childClass(2, 3);
    instance.a;
    instance.b;
`);

expect(['parentClass', 'childClass', 'grandChildClass', {a: 2, b: 3, c: 4}, 2, 3, 4], `
    let parentClass = class {
        init (a) {
            this.a = a;
        }
    };
    let childClass = class extends parentClass {
        init (a, b) {
            super(a);
            this.b = b;
        }
    };
    let grandChildClass = class extends childClass {
        init (a, b, c) {
            super(a, b);
            this.c = c;
        }
    };
    let instance = grandChildClass(2, 3, 4);
    instance.a;
    instance.b;
    instance.c;
`);

expect(['parentClass', 'childClass', 'grandChildClass', 'greatGrandChildClass', {a: 2, b: 3, c: 4, d: 5}, 2, 3, 4, 5], `
    let parentClass = class {
        init (a) {
            this.a = a;
        }
    };
    let childClass = class extends parentClass {
        init (a, b) {
            super(a);
            this.b = b;
        }
    };
    let grandChildClass = class extends childClass {
        init (a, b, c) {
            super(a, b);
            this.c = c;
        }
    };
    let greatGrandChildClass = class extends grandChildClass {
        init (a, b, c, d) {
            super(a, b, c);
            this.d = d;
        }
    };
    
    let instance = greatGrandChildClass(2, 3, 4, 5);
    instance.a;
    instance.b;
    instance.c;
    instance.d;
`);

// INHERITANCE
expect(['parentClass', 'childClass', {doThing: '<Func>', doOtherThing: '<Func>'}, 3, 2], `
    let parentClass = class {
        doThing () {
        	return 1;
        }
        
		doOtherThing () {
        	return 2;
        }
    };
    
    let childClass = class extends parentClass {
		doThing () {
        	return 3;
        }
    };
    
    let instance = childClass();
    instance.doThing();
    instance.doOtherThing();
`);


// POLYMORPHISM
expect(['parentClass', 'childClass', {doThing: '<Func>', doOtherThing: '<Func>'}, true, true, true, false], `
    let parentClass = class {
        doThing () {
        	return 1;
        }
        
		doOtherThing () {
        	return 2;
        }
    };
    
    let childClass = class extends parentClass {
		doThing () {
        	return 3;
        }
    };
    
    let instance = childClass();
    instance.isa(childClass);
    instance.isa(Object);
    instance.isa(parentClass);
    instance.isa(String);
`);