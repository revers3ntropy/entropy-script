const {expect, file} = require( '../../testFramework');
file('typing/not');

expect([1], `
    let b: (~String) = 1;
`);

expect('TypeError', `
    let b: (~String) = 'hi';
`);

expect([''], `
    let b: (~~String) = '';
`);

expect('TypeError', `
    let b: (~~String) = 1;
`);

expect(['parentClass', 'childClass1', 'childClass2', {}], `
    let parentClass = class {};
    let childClass1 = class extends parentClass {};
    let childClass2 = class extends parentClass {};
    let a: parentClass = childClass1();
`);

expect('TypeError', `
    let parentClass = class {};
    let childClass1 = class extends parentClass {};
    let childClass2 = class extends parentClass {};
    let a: (~parentClass) = childClass1();
`);

expect('TypeError', `
    let parentClass = class {};
    let childClass1 = class extends parentClass {};
    let childClass2 = class extends parentClass {};
    let a: (parentClass & ~childClass2) = childClass2();
`);

expect(['parentClass', 'childClass1', 'childClass2', {}], `
    let parentClass = class {};
    let childClass1 = class extends parentClass {};
    let childClass2 = class extends parentClass {};
    let a: (parentClass & ~childClass2) = childClass1();
`);