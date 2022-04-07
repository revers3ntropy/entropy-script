// basic stuff
(1 + 1) * 10.7; // 21.4
let name = 'bob';
let message = 'hi my name is ' + name;
print(message); // hi my name is bob

// loops
for i in 3 {
    print(i);
}
// 0, 1, 2
// accessing i would give error

for i in [0, 1, 2] {
	print(i);
}
    // 0, 1, 2
i; // 2

while i < 10 {
    i += 1;
}
i; // 9, as i is now defined globally


// functions
let my_func = func () {
    let output = '';
    for let arg in args {
        output += arg.str();
    }
    return output;
}; // note the ; after functions

print(my_func('hi ', 123, ['hi', 1])); // hi 123[hi, 1];

// callbacks and higher order functions
var wrapper = func (f: function) {
    f('hi');
};

wrapper(func (message) {
    print(message);
}); // hi

// objects
let b = 0;
let obj = {
    b: 1,
    [b]: 2,
    'c': 3
};

obj.b; // 1
obj[b]; // 2
obj['c']; // 3
obj.d = 4;
obj['e'] = 5;
obj.d; // 4
obj.e; // 5

// and arrays
let arr = [0, 1, 2, 3];
arr[0]; // 0
arr[0] = 4;
arr[0]; // 4
arr.add(7);
arr.contains(4); // false
arr.contains(2); // true
arr.contains(7); // true
arr.add('hi!', 2);
print(arr); // [0, 1, 'hi!', 2, 3, 7]

// classes
const MyClass = class {
    init (a: any) {
        this.a = a;
    }

    setA (b) {
        this.a = b;
    }

    getA () {
        return a;
    }

    output () {
        print(this.a.str());
    }
};
let instance = MyClass(1);
instance.output(); // MyClass: 1
instance.setA('hello world');
instance.output(); // MyClass: hello world
instance.a = 2;
print(instance);
/*
	<ESObject Object: {
		setA: <Func: setA>,
		getA: <Func: getA>,
		output: <Func: output>,
		a: 2
	}>
*/

