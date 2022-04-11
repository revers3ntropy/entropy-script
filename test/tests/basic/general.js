const {expect, file} = require( '../../testFramework');
file('basic/general');

expect([], '');


// basic arithmetic
expect([1.99], '1.99');
expect([2], '1+1');
expect([2], '1   + 1  ');
expect([22], '2 + 4 * 5');
expect([30], '(2+4) * 5');
expect([19], '3 + 4 ^ 2');


// boolean logic
expect([false], '2 == 1');
expect([true], '2 == 2');
expect([false], '2 != 2');
expect([false], '2 == 4 || 3 == 2');
expect([true], '2 + 2 == 4 || 3 + 2 == 2');
expect([false], '2 + 2 == 4 && 3 + 2 == 2');
expect([true], 'true && 3 - 1 == 2');
expect([true], '!false');
expect([true], '"hi" == "hi"');
expect([true], '"hi" != "hijj"');

expect([Infinity], 'inf');
expect([-Infinity], '-inf');

// multi-line statements
expect([true, 7], '2 == 2; 2 + 5');

// strings
expect(['a', 'bc', 'defg'], '"a"; `bc`; \'defg\'');
expect([`h'h`], `'h\\'h'`);


// variables
expect('InvalidSyntaxError', `
	let var a = 1; 
	a = 2; 
	let var a = 1;
`);
expect('ReferenceError', 'a');
expect([1], 'let global b = 1');
expect([1], 'let c = 1');
expect([undefined], 'let var d;');
expect([1, 2], 'let var e = 1; e = e + 1;');
expect('ReferenceError', 'let var f = f + 1;');
expect([undefined, true], 'let var g; g == nil;');
expect('InvalidSyntaxError', 'let g');
expect([1, 2], `let var n = 1; n = 2;`);
expect('TypeError', `let n = 1; n = 2;`);
expect('InvalidSyntaxError', `let n = 1; let n = 2;`);

// %
expect([3], `3 % 15`);
expect([0], `15 % 3`);
expect([1], `3 % 2`);
expect([false], `3 % 2 == 0`);
expect([false], `14 % 2 != 0`);

// ??
expect([1], `nil ?? 1`);
expect([undefined], `nil ?? nil`);
expect([1], `nil ?? 1 ?? nil`);
expect([3], `3 ?? 4`);
expect([0], `0 ?? 4`);
expect([''], `'' ?? 4`);
expect([[]], `[] ?? 4`);
expect([{}], `{} ?? 4`);
expect(['Null'], `Null ?? 4`);
expect(['Null'], `nil ?? Null`);