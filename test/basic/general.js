import {expect, file} from '../testFramework.js';
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

// multi-line statements
expect([true, 7], '2 == 2; 2 + 5');

// strings
expect(['a', 'bc', 'defg'], '"a"; `bc`; \'defg\'');
expect([`h'h`], `'h\\'h'`);


// variables
expect('InvalidSyntaxError', 'var a = 1; a = 2; var a = 1;');
expect('ReferenceError', 'a');
expect([1], 'global a = 1');
expect([1], 'a = 1');
expect([undefined], 'var a;');
expect([1, 2], 'var a = 1; a = a + 1;');
expect('ReferenceError', 'var a = a + 1;');
expect([undefined, true], 'var a; a == nil;');
expect([1, 2], `let n = 1; n = 2;`);
expect('TypeError', `const n = 1; n = 2;`);
expect('InvalidSyntaxError', `const n = 1; const n = 2;`);