const {expect, file} = require( '../../testFramework');
file('std/type');


expect(['Num'], 'Type(1.1)');
expect(['Type'], 'Type(Type)');
expect(['Str'], 'Type(Type(Type))');
expect(['Type'], 'Type(Num)');
expect(['(anon)'], 'Type()');
expect(['Func'], 'Type(parse_num)');
expect(['Str'], 'Type("hi")');
expect(['Obj'], 'Type({a: 3})');
expect(['Arr'], 'Type([1, 2, 3])');