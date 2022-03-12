const {expect, file} = require( '../../testFramework');
file('typing/not');

expect([1], `
    var b: (~string) = 1;
`);

expect('TypeError', `
    let b: (~string) = 'hi';
`);

expect([''], `
    let b: (~~string) = '';
`);

expect('TypeError', `
    let b: (~~string) = 1;
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