const {expect, file} = require( '../../testFramework');
file('std/string');


expect(['5'], 'Str(5)');
expect(['5'], `Str('5')`);
expect(['[]'], `Str([])`);