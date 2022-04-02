const {expect, file} = require( '../../testFramework');
file('typing/templates');


expect(['<SomeType>', {}], `
    class SomeType { 
        init (T: Type, a: T) {
            this.T = T;
        }
    };
    SomeType(Str, '');
`);

expect(['<SomeType>', {}], `
    class SomeType <T> {};
    SomeType<Str>();
`);
expect(['<SomeType>', {}], `
    class SomeType <T1, T2> {};
    SomeType<Str, SomeType>();
`);
expect(['<SomeType>', {}], `
    class SomeType <T> {};
    let a = SomeType<Str>();
    let b: SomeTime<Str> = a;
`);
expect(['<SomeType>', {}], `
    class SomeType <T=Any> {};
    SomeType<Str>();
    SomeType();
`);
expect(['<SomeType>', {}], `
    class SomeType <T=Any> {};
    let a = SomeType<Str>();
    let var b: SomeType = SomeType();
    b = a;
`);
expect(['<SomeType>', {}], `
    class SomeType <T=Any> {};
    let a: SomeTime = SomeType<Str>();
`);
expect(['<SomeType>', {}], `
    class SomeType <T=Any> {};
    let a: SomeTime<Str> = SomeType<Str>();
`);
expect(['<SomeType>', {}], `
    class SomeType <T> {
    	init(value: T) {
    		this.v = value;
    	}
    };
    let a: SomeTime<Str> = SomeType<Str>('');
    a.v;
`);

expect(['<SomeType>', {}], `
    class SomeType <T> {
    	init(value: T) {
    		this.v = value;
    	}
    };
    let a: SomeTime<Str> = SomeType<Str>('');
    a.v;
`);