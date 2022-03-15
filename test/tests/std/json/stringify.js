const {expect, file} = require( '../../../testFramework');
file('std/json/stringify');

expect(['{}'], `import('json').stringify({})`);