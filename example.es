// basic stuff
(1 + 1) * 10.7; // 21.4
let name = 'bob';
let message = 'hi my name is ' + name;
print(message); // hi my name is bob

// loops
for (i in 3) {
    print(i);
}
// 0, 1, 2
// accessing i would give error

for (global i in [0, 1, 2])
    print(i);
    // 0, 1, 2
i; // 2

while (i < 10) {
    i += 1;
}
i; // 9


// functions
let myFunc = func () {
    let output = '';
    for (let arg in args) {
        output += str(arg);
    }
    return output;
}; // note the ;

print(myFunc('hi ', 123, ['hi', 1])); // hi 123[hi, 1];

// callbacks and higher order functions
var wrapper = func (function) {
    return func () {
        function('hi');
    }
};

wrapper(func(message) {
    print(message);
}); // hi

// objects
let b = 0;
let object = {
    b: 1,
    [b]: 2,
    'c': 3
};

object.b; // 1
object[b]; // 2
object['c']; // 3
object.d = 4;
object['e'] = 5;
object.d; // 4
object.e; // 5

// and arrays
let array = [0, 1, 2, 3];
array[0]; // 0
array[0] = 4;
array[0]; // 4
contains(array, 4); // false
contains(array, 2); // true

// classes
let MyClass = class {
    init (a) {
        this.a = a;
    }

    setA (b) {
        this.a = b;
    }

    getA () {
        return a;
    }

    log () {
        print(this.constructor.name + ': ' + str(this.a));
    }
};
let instance = MyClass(1);
instance.log(); // MyClass: 1
instance.setA('hello world');
instance.log(); // MyClass: hello world
instance.a = 2;
print(instance); // MyClass: {setA: N_function, getA: N_function, log: N_function, a: 2}
