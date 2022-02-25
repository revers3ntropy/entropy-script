import {expect, file} from '../../testFramework';
file('std/array');

expect([['1.2']], 'array(`1.2`)');
expect([['1.2', 1, 2]], 'array(`1.2`, 1, 2)');
expect([[[0, 1, 2]]], 'array([0, 1, 2])');
expect([[{}]], 'array({})');