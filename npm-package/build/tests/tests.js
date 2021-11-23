import{expect}from"./testFramework.js";expect([1.99],"1.99"),expect([2],"1+1"),expect([2],"1   + 1  "),expect([22],"2 + 4 * 5"),expect([30],"(2+4) * 5"),expect([19],"3 + 4 ^ 2"),expect([!0],"true"),expect([!1],"false"),expect([void 0],"undefined"),expect([!1],"2==1"),expect([!0],"2==2"),expect([!1],"2!=2"),expect([!1],"2 == 4 || 3 == 2"),expect([!0],"2 + 2 == 4 || 3 + 2 == 2"),expect([!1],"2 + 2 == 4 && 3 + 2 == 2"),expect([!0],"true && 3 - 1 == 2"),expect([!0],"!false"),expect([!0],'"hi" == "hi"'),expect([!0],'"hi" != "hijj"'),expect([!0,!1],"2==2; 2==5"),expect(["a","bc","defg"],"\"a\"; `bc`; 'defg'"),expect(["h'h"],"'h\\'h'"),expect("InvalidSyntaxError","var a = 1; a = 2; var a = 1;"),expect("ReferenceError","a"),expect([1],"global a = 1"),expect([1],"a = 1"),expect([void 0],"var a;"),expect([1,2],"var a = 1; a = a + 1;"),expect("ReferenceError","var a = a + 1;"),expect([void 0,!0],"var a; a == undefined;"),expect([1,2],"let n = 1; n = 2;"),expect("TypeError","const n = 1; n = 2;"),expect("InvalidSyntaxError","const n = 1; const n = 2;"),expect(["aa","bb",!0,void 0,!1],"\nlet a = 'aa';\nlet b = 'bb';\nlet res = true;\nif (a == 'aa' && b != 'cc')\n    res = false;\nres;\n"),expect([1,2],"\n    var n = 1;\n    n += 1;\n"),expect([1,50],"\n    var n = 1;\n    n *= 50;\n"),expect([6,2],"\n    var n = 6;\n    n /= 3;\n"),expect(["hello","hello world"],"\n    var n = 'hello';\n    n += ' world';\n"),expect([void 0],"\n    if (!true && 1 || 7 + 2) {\n        \n    } else {\n        \n    }\n"),expect([!1,void 0,void 0,!0],"\n    var result = false;\n    var output;\n    if (result)\n        output = false;\n    else\n        output = !result;\n    output;\n"),expect([void 0,void 0,!1],"\n    var output;\n    if (true) {\n        output = true;\n        output = false;\n    } else {\n        output = 1;\n    }\n    output;\n   \n"),expect([void 0,0,void 0,9,10],"\n    var output;\n    var i = 0;\n    while (i < 10) {\n        output = i;\n        i = i + 1;\n    }\n    output; i;\n"),expect([0,void 0,10],"\n    var i = 0;\n    while (i < 10)\n        i = i + 1;\n    i;\n"),expect(["hi"],"\n    let global const a = 'hi';\n"),expect("TypeError","\n    var global const a = 'hi';\n    a = 1;\n"),expect("TypeError","\n    var local const a = 'hi';\n    a = 1;\n"),expect("InvalidSyntaxError","\n    var local mutable a = 'hi';\n    let a = 1;\n"),expect(["hi",1],"\n    var local mutable a = 'hi';\n    a = 1;\n"),expect("InvalidSyntaxError","\n    let a += 1;\n"),expect([[0,1,2]],"\n    [0, 1, 2];\n"),expect([[[6,8],1,[8,9]]],"\n    [[6, 8], 1, [8, 9]];\n"),expect([[0,1,2],1],"\n    var arr = [0, 1, 2];\n    arr[1];\n"),expect([[[1,2],1,2],2],"\n    var arr = [[1, 2], 1, 2];\n    arr[0][1];\n"),expect([[0,1,2],2,[0,2,2]],"\n    var arr = [0, 1, 2];\n    arr[1] = 2;\n    arr;\n"),expect([[[1,2],1,2],5,[[1,5],1,2]],"\n    var arr = [[1, 2], 1, 2];\n    arr[0][1] = 5;\n    arr;\n"),expect([{a:1},2],"\n    n = {a: 1};\n    n.a += 1;\n"),expect("TypeError","\n    n = 0;\n    n.n = 1;\n"),expect([void 0,void 0,2],"\n    var output;\n    for (var i in [0, 1, 2]) {\n        output = i;\n    }\n    output;\n"),expect([void 0,2],"\n    for (global i in [0, 1, 2]) {}\n    i;\n"),expect([void 0,void 0,2],"\n    var output;\n    for (i in [0, 1, 2]) {\n        output = i;\n    }\n    output;\n"),expect([0,void 0,3],"\n    var sum = 0;\n    for (i in [0, 1, 2]) {\n        sum = sum + i;\n    }\n    sum;\n"),expect([void 0,void 0,2],"\n    var output;\n    for (i in 3) {\n        output = i;\n    }\n    output;\n"),expect([void 0,0,void 0,0,1],"\n    var output;\n    var i_ = 0;\n    for (i in range(3)) {\n        if (i == 1) break;\n        output = i;\n        i_ = i_ + 1;\n    }\n    output;\n    i_;\n"),expect([void 0,0,void 0,2,2],"\n    var output;\n    var i_ = 0;\n    for (i in range(3)) {\n        if (i == 1) continue;\n        output = i;\n        i_ = i_ + 1;\n    }\n    output;\n    i_;\n"),expect([void 0],"\n    log('testing logging function');\n"),expect([[0,1,2]],"range(3)"),expect([void 0,2],"\n    for (global i in range(3)) {}\n    i;\n"),expect([],""),expect([],"// hiii"),expect([1],"// hiii \n 1"),expect(["<Func: myFunc>",1],"\nvar myFunc = func () {\n    return 1;\n};\nmyFunc();\n"),expect(["<Func: myFunc>",1],"\nvar myFunc = func (cb) {\n    return cb();\n};\nmyFunc(func () {\n    return 1;\n});\n"),expect(["<Func: myFunc>",3],"\nvar myFunc = func (n) {\n    if (n < 4)\n        return n;\n    return myFunc(n-1);\n};\nmyFunc(10);\n"),expect(["<Func: myFunc>",1],"\nvar myFunc = func () {\n    yield 1;\n};\nmyFunc();\n"),expect(["<Func: myFunc>",void 0],"\nvar myFunc = func () {\n    yield 0;\n};\nmyFunc();\n"),expect(["<Func: myFunc>",2],"\nvar myFunc = func () {\n    yield 0;\n    yield [];\n    return 2;\n};\nmyFunc();\n"),expect(["<Func: myFunc>","hi"],"\nvar myFunc = func () {\n    yield 'hi';\n    return 2;\n};\nmyFunc();\n"),expect(["<Func: myFunc>",void 0],"\nvar myFunc = func () {\n    return;\n    return 2;\n};\nmyFunc();\n"),expect(["<Func: myFunc>",4],"\nvar myFunc = func (n, cb) {\n    while (!cb(n)) {\n        n = n - 1;\n    }\n    return n;\n};\nmyFunc(20, func (n) {\n    return n < 5;\n});\n"),expect(["<Func: myFunc>","<Func: myOtherFunc>",1],"\nvar myFunc = func (cb) {\n    return cb();\n};\n\nvar myOtherFunc = func () {\n    let a = 1;\n    return myFunc(func () {\n        return a;\n    });\n};\nmyOtherFunc();\n"),expect(["<Func: myFunc>",0],"\nvar myFunc = func (arr) {\n    for (var n in arr) {\n        return n;\n    }\n};\nmyFunc([0, 1, 2, 3]);\n"),expect(["<Func: myFunc>",3],"\nvar myFunc = func (arr, cb) {\n    for (var n in arr) {\n        if (cb(n)) {\n            return n;\n        }\n    }\n};\nmyFunc([0, 1, 2, 3], func (n) {\n    return n == 3;\n});\n"),expect(["<Func: myFunc>",2],"\nvar myFunc = func () {\n    return [0, 1, [0, 2]];\n};\nmyFunc()[2][1];\n"),expect(["<Func: myFunc>","hi"],"\nvar myFunc = func () {\n    return args[0];\n};\nmyFunc('hi', 1, 2);\n"),expect(["<Func: myFunc>",void 0],"\nvar myFunc = func (arg) {\n    return arg;\n};\nmyFunc();\n"),expect(["<Func: myFunc>","hello world"],"\nvar myFunc = func (str1, str2, str3) {\n    return str1 + str2 + str3;\n};\nmyFunc('hel', 'lo w', 'orld');\n"),expect(["<Func: airport>"],"\nglobal airport = func () {\n    var exists = false;\n    gg = false;\n    // wont get logged as not running function\n    log('hi');\n};\n"),expect([{},1,1,1],"\n    var a = {};\n    a['a'] = 1;\n    a.a;\n    a['a'];\n"),expect([{},1,1,1],"\n    var a = {};\n    a.a = 1;\n    a.a;\n    a['a'];\n"),expect([{a:{}},6,6,6,6,6],"\n    var a = {a: {}};\n    a.a.a = 6;\n    a.a.a;\n    a['a'].a;\n    a.a['a'];\n    a['a']['a'];\n"),expect([{a:1},1],"\n    var a = {a: 1};\n    a.a;\n"),expect([{a:1},1,1],"\n    var a = {'a': 1};\n    a['a'];\n    a.a;\n"),expect(["a",{a:1},1,1],"\n    var b = 'a';\n    var a = {[b]: 1};\n    a['a'];\n    a.a;\n"),expect([{a:"<Func: (anon)>"},"<Func: (anon)>","e"],"\n    var a = {a: func () {\n        return 'hello world';\n    }};\n    a.a;\n    a.a()[1];\n"),expect(["<Type: myClass>"],"\n    var myClass = class {\n        init () {}\n        publicFunction () {}\n    };\n"),expect(["<Type: myClass>"],"\n    var myClass = class {\n        init (a) {\n            this.a = a;\n        }\n    };\n"),expect(["<Type: myClass>","myClass",3],"\n    var myClass = class {\n        init (a) {\n            this.a = a;\n        }\n    };\n    \n    var myInstance = myClass(3);\n    myInstance.a;\n"),expect(["<Type: myClass>","myClass",3,void 0,5],"\n    var myClass = class {\n        init (a) {\n            this.a = a;\n        }\n        \n        setA (a) {\n            this.a = a;\n        }\n    };\n    \n    var myInstance = myClass(3);\n    myInstance.a;\n    myInstance.setA(5);\n    myInstance.a;\n"),expect(["<Type: myClass>","myClass",3,void 0,10],"\n    var myClass = class {\n        init (a) {\n            this.a = a;\n        }\n        \n        setA (a) {\n            this.a = a;\n        }\n        \n        doThing () {\n            this.setA(10);\n        }\n    };\n    \n    var myInstance = myClass(3);\n    myInstance.a;\n    myInstance.doThing();\n    myInstance.a;\n"),expect(["<Type: myClass>","myClass",3,"myClass",!0,!1,!1],"\n    var myClass = class {\n        init (a) {\n            this.a = a;\n        }\n        \n        getThis () {\n            return this;\n        }\n    };\n    \n    var myInstance = myClass(3);\n    myInstance.a;\n    var this_ = myInstance.getThis();\n    this_ == myInstance;\n    this_ == myClass(3);\n    myInstance == myClass(3);\n"),expect(["<Type: parentClass>","<Type: childClass>","childClass",2,3,"childClass"],"\n    var parentClass = class {\n        init (a) {\n            this.a = a;\n        }\n    };\n    var childClass = class extends parentClass {\n        init (a, b) {\n            super(a);\n            this.b = b;\n        }\n    };\n    var instance = childClass(2, 3);\n    instance.a;\n    instance.b;\n    instance.constructor.name;\n"),expect(["<Type: parentClass>","<Type: childClass>","<Type: grandChildClass>","grandChildClass",2,3,4,"grandChildClass"],"\n    var parentClass = class {\n        init (a) {\n            this.a = a;\n        }\n    };\n    var childClass = class extends parentClass {\n        init (a, b) {\n            super(a);\n            this.b = b;\n        }\n    };\n    var grandChildClass = class extends childClass {\n        init (a, b, c) {\n            super(a, b);\n            this.c = c;\n        }\n    };\n    var instance = grandChildClass(2, 3, 4);\n    instance.a;\n    instance.b;\n    instance.c;\n    instance.constructor.name;\n"),expect(["<Type: parentClass>","<Type: childClass>","<Type: grandChildClass>","<Type: greatGrandChildClass>","greatGrandChildClass",2,3,4,5,"greatGrandChildClass"],"\n    var parentClass = class {\n        init (a) {\n            this.a = a;\n        }\n    };\n    var childClass = class extends parentClass {\n        init (a, b) {\n            super(a);\n            this.b = b;\n        }\n    };\n    var grandChildClass = class extends childClass {\n        init (a, b, c) {\n            super(a, b);\n            this.c = c;\n        }\n    };\n    var greatGrandChildClass = class extends grandChildClass {\n        init (a, b, c, d) {\n            super(a, b, c);\n            this.d = d;\n        }\n    };\n    \n    var instance = greatGrandChildClass(2, 3, 4, 5);\n    instance.a;\n    instance.b;\n    instance.c;\n    instance.d;\n    instance.constructor.name;\n"),expect([10,10],"\n    let a: number = 10;\n    a;\n"),expect("TypeError","\n    const a: number = 'hi';\n"),expect(["<Type: myClass>","myClass","myClass"],"\n    const myClass = class {};\n    let a = myClass();\n    let b: myClass = a;\n"),expect("TypeError","\n    const myClass = class {};\n    let b: myClass = 1;\n"),expect("TypeError","\n    let b: string = func () 0;\n"),expect("TypeError","\n    let b: number = ['hi'];\n"),expect("TypeError","\n    let b: string = undefined;\n"),expect(["<Func: f>","hello world"],"\n    const f = func (a: string, b: string) {\n        return a + b;\n    };\n    f('hello', ' world');\n"),expect(["<Func: f>",21],"\n    const f = func (x: number){\n        return 2 * x + 1;\n    };\n    f(10);\n"),expect("TypeError","\n    const f = func (x: number) {\n        return 2 * x + 1;\n    };\n    f([10]);\n"),expect(["<Func: append_>",[10]],"\n    const append_ = func (a: array, item: any): array {\n        a.add(item);\n        return a;\n    };\n    append_([], 10);\n"),expect("TypeError","\n    const append_ = func (a: array, item: any): number {\n        a.add(item);\n        return a;\n    };\n    append_([], 10);\n"),expect(["<Type: Concatenator>","Concatenator","hello world"],"\n    const Concatenator = class {\n        init (str1: string) {\n            this.str = str1;\n        }\n        \n        concat (str2: string): string {\n            return this.str + str2;\n        }\n    };\n    \n    const concat = Concatenator('hello ');\n    concat.concat('world');\n    \n"),expect("TypeError","\n    const Concatenator = class {\n        init (str1: string) {\n            this.str = str1;\n        }\n    };\n    const concat = Concatenator(12);\n"),expect([1],'parseNum("1")'),expect([1.1],'parseNum("1.1")'),expect([1.1],"parseNum(1.1)"),expect(["Number"],"type(1.1)"),expect(["Type"],"type(type)"),expect(["Type"],"type(number)"),expect([void 0],"type()"),expect(["Function"],"type(parseNum)"),expect(["String"],'type("hi")'),expect(["Object"],"type({a: 3})"),expect(["Array"],"type([1, 2, 3])"),expect([1.2],"number(1.2)"),expect([["1.2"]],"array(`1.2`)"),expect(["5"],"string(5)"),expect(["<Func: myFunc>","hi"],"\n    const myFunc = func () { return 'hi' };\n    myFunc();\n"),expect(["<Func: myFunc>","hi"],"\n    const myFunc = func () { 'hi' };\n    myFunc();\n"),expect(["<Func: myFunc>","hi"],"\n    const myFunc = func () 'hi';\n    myFunc();\n"),expect(["<Func: myFunc>","hi"],"\n    const myFunc = func(n)n;\n    myFunc('hi');\n"),expect(["<Func: wrapper>","<Func: (anon)>","hiii"],"\n    const wrapper = func (function) {\n        var a = 'hiii';\n        return func () a;\n    };\n    wrapper();\n    wrapper()();\n"),expect(["<Func: wrapper>","hello world"],"\n    const wrapper = func (fn) {\n        let str1 = 'hello';\n        return fn(func () {\n            const str2 = ' world';\n            return func () str1 + str2;\n        });\n    };\n    \n    wrapper(func (v) v()());\n"),expect(["<Type: v2>","v2","v2","3, 4","v2","8, 10",!1,"v2","8, 10","9, 11"],"\n    const v2 = class {\n        init (x: number, y: number) {\n            this.x = x;\n            this.y = y;\n        }\n        \n        add (v: any): any {\n            this.x += v.x;\n            this.y += v.y;\n            return this;\n        }\n        \n        scale (n: number): any {\n            this.x *= n;\n            this.y *= n;\n            return this;\n        }\n       \n        clone (): any {\n            return v2(this.x, this.y);\n        }\n        \n        str (): string {\n            return this.x.str() + ', ' + this.y.str();\n        }\n    };\n    \n    var pos = v2(0, 0);\n    pos.add(v2(3, 4));\n    pos.str();\n    pos.add(v2(1, 1)).scale(2);\n    pos.str();\n    pos.clone() == pos;\n    var clone = pos.clone().add(v2(1, 1));\n    pos.str();\n    clone.str();\n"),expect([{}],"\n    global const MyLib = namespace {};\n"),expect([{a:"<Symbol: a>"},"hi"],"\n    global const MyLib = namespace {\n        const a = 'hi';\n    };\n   MyLib.a;\n"),expect("TypeError","\n    global const MyLib = namespace {\n        const a: number = 0;\n    };\n   MyLib.a = 1;\n"),expect([{a:"<Symbol: a>"},1],"\n    global MyLib = namespace {\n        mutable a: number = 0;\n    };\n   MyLib.a = 1;\n"),expect([{myClass:"<Symbol: myClass>",myFunc:"<Symbol: myFunc>",a:"<Symbol: a>"},"<Type: myClass>","myClass",123,"Hello world!"],"\n    global const MyLib = namespace {\n        const myClass = class {\n            init () {\n                this.thing = 123;\n            }\n        };\n    \n        const myFunc = func (obj: myClass) {\n            return obj.thing;\n        };\n    \n        const a = 'Hello world!';\n    };\n    \n    let myType = MyLib.myClass;\n    let const instance: myType = MyLib.myClass();\n    MyLib.myFunc(instance);\n    MyLib.a;\n");