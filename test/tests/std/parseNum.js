import {expect, file} from '../../testFramework';
file('std/parseNum');


expect([1], 'parseNum("1")');
expect([1.1], 'parseNum("1.1")');
expect([1.1], 'parseNum(1.1)');