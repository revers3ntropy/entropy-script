const {expect, file} = require( '../../../testFramework');
file('std/primitive/str');

expect(['1.2'], `1.2.str()`);
expect(['1'], `1.str()`);
expect(['1000'], `1000['str']()`);
expect(['[]'], `[].str()`);
expect(['{}'], `{}.str()`);
expect(['nil'], `nil.str()`);
expect(['hi'], `'hi'.str()`);