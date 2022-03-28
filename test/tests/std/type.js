const {expect, file} = require( '../../testFramework');
file('std/type');


expect(['Number'], 'Type(1.1)');
expect(['Type'], 'Type(Type)');
expect(['String'], 'Type(Type(Type))');
expect(['Type'], 'Type(Number)');
expect(['(anon)'], 'Type()');
expect(['Function'], 'Type(parse_num)');
expect(['String'], 'Type("hi")');
expect(['Object'], 'Type({a: 3})');
expect(['Array'], 'Type([1, 2, 3])');