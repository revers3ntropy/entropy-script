const {expect, file} = require( '../../testFramework');
file('basic/objects');

expect([{a: 1}, 2], `
    let n = {a: 1};
    n.a += 1;
`);

expect([{}, 1, 1, 1], `
    let a = {};
    a['a'] = 1;
    a.a;
    a['a'];
`);
expect([{}, 1, 1, 1], `
    let a = {};
    a.a = 1;
    a.a;
    a['a'];
`);
expect([{a: {a: 6}}, 6, 6, 6, 6, 6], `
    let a = {a: {}};
    a.a.a = 6;
    a.a.a;
    a['a'].a;
    a.a['a'];
    a['a']['a'];
`);
expect([{a: 1}, 1], `
    let a = {a: 1};
    a.a;
`);
expect([{a: 1}, 1, 1], `
    let a = {'a': 1};
    a['a'];
    a.a;
`);
expect(['a', {a: 1}, 1, 1], `
    let b = 'a';
    let a = {[b]: 1};
    a['a'];
    a.a;
`);
expect([{a: '<Func>'}, '<Func>', 'e'], `
    let a = {a: func () {
        return 'hello world';
    }};
    a.a;
    a.a()[1];
`);

// passing objects
expect(['<Func>', {a: 2}, 1, 1], `
    let changer = func (a) {
        a.a = 1;
        return a.a;
    };
    let p = {a: 2};
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
expect('TypeError', `{b: 2} + Type`);
expect('TypeError', `{b: 2} + String`);
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
expect('TypeError', `{b: 2} - Type`);
expect('TypeError', `{b: 2} - String`);
expect('TypeError', `{b: 2} - (func () {})`);
expect('TypeError', `-{b: 2}`);
