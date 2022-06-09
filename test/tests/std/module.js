const {expect, file} = require( '../../testFramework');
file('std/module');

const mName = `'some_module_that_does_not_exist'`;
expect('ImportError', `
    import(${mName});
`);
expect([undefined], `
    module(${mName}, {});
`);
expect([undefined], `
    module(${mName}, class {});
`);
expect([undefined], `
    module(${mName}, import('ascii'));
`);
expect([undefined], `
    module(${mName}, func () {});
`);
expect([undefined, 0], `
    module(${mName}, func () 0);
    import(${mName})();
`);
expect([undefined, {a: '<Func>', b: 'hi'}, 1, 'hi'], `
    module(${mName}, {
        a: func () 1,
        b: 'hi'
    });
    let [a: func () Any, b] = import(${mName});
    a(); 
    b;
`);