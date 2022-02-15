import {expect} from '../testFramework.js';

expect([{a:1}, 2], `
    n = {a: 1};
    n.a += 1;
`);
expect('TypeError', `
    n = 0;
    n.n = 1;
`);

expect([{}, 1, 1, 1], `
    var a = {};
    a['a'] = 1;
    a.a;
    a['a'];
`);
expect([{}, 1, 1, 1], `
    var a = {};
    a.a = 1;
    a.a;
    a['a'];
`);
expect([{a: {}}, 6, 6, 6, 6, 6], `
    var a = {a: {}};
    a.a.a = 6;
    a.a.a;
    a['a'].a;
    a.a['a'];
    a['a']['a'];
`);
expect([{a: 1}, 1], `
    var a = {a: 1};
    a.a;
`);
expect([{a: 1}, 1, 1], `
    var a = {'a': 1};
    a['a'];
    a.a;
`);
expect(['a', {a: 1}, 1, 1], `
    var b = 'a';
    var a = {[b]: 1};
    a['a'];
    a.a;
`);
expect([{a: '<Func: (anon)>'}, '<Func: (anon)>', 'e'], `
    var a = {a: func () {
        return 'hello world';
    }};
    a.a;
    a.a()[1];
`);

// passing objects
expect(['<Func: changer>', {a: 2}, 1, 1], `
    const changer = func (a) {
        a.a = 1;
        return a.a;
    };
    const p = {a: 2};
    changer(p);
    p.a;
`);

// equality
expect([true], `{} == {}`);
expect([true], `{a: 1} == {a: 1}`);
expect([false], `{b: 1} == {a: 1}`);
expect([false], `{a: 2} == {a: 1}`);
expect([false], `{a: 1, b: 2} == {a: 1}`);
expect([true], `{a: 1} != {a: 1, b: 1}`);


// operations
expect([{a: 1, b: 1}], `{a: 1} + {b: 1}`);
expect([{b: 1}], `{b: 1} + {b: 1}`);
expect([{b: 2}], `{b: 2} + {b: 1}`);
expect([{b: 2, a: 1}], `{b: 2} + {b: 1, a: 1}`);
expect('TypeError', `{b: 2} + 1`);
expect('TypeError', `{b: 2} + []`);
expect('TypeError', `{b: 2} + ''`);
expect('TypeError', `{b: 2} + nil`);
expect('TypeError', `{b: 2} + type`);
expect('TypeError', `{b: 2} + string`);
expect('TypeError', `{b: 2} + (func () {})`);
expect('TypeError', `+{b: 2}`);

expect([{}], `{b: 2} - 'b'`);
expect([{b: 2}], `{b: 2} - 'a'`);
expect([{b: 2}], `{b: 2} - ''`);
expect([{b: 2}], `{b: 2} - []`);
expect([{}], `{a: 1, b: 2} - ['a', 'b']`);
expect([{b: 2}], `{a: 1, b: 2} - ['a']`);
expect('TypeError', `{b: 2} - 1`);
expect('TypeError', `{b: 2} - nil`);
expect('TypeError', `{b: 2} - type`);
expect('TypeError', `{b: 2} - string`);
expect('TypeError', `{b: 2} - (func () {})`);
expect('TypeError', `-{b: 2}`);
