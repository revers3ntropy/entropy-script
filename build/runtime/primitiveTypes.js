import { types } from './primitives/primitive.js';
import { ESPrimitive } from './primitives/esprimitive.js';
import { ESArray } from './primitives/esarray.js';
import { ESBoolean } from './primitives/esboolean.js';
import { ESErrorPrimitive } from './primitives/eserrorprimitive.js';
import { ESFunction } from './primitives/esfunction.js';
import { ESNumber } from './primitives/esnumber.js';
import { ESObject } from './primitives/esobject.js';
import { ESString } from './primitives/esstring.js';
import { ESType } from './primitives/estype.js';
import { ESUndefined } from './primitives/esundefined.js';
import { ESNamespace } from './primitives/esnamespace.js';
export { ESArray, ESBoolean, ESErrorPrimitive, ESFunction, ESNumber, ESPrimitive, ESString, ESObject, ESType, ESUndefined, ESNamespace, types };
types.type = new ESType(true, 'Type');
types.undefined = new ESType(true, 'Undefined');
types.string = new ESType(true, 'String');
types.array = new ESType(true, 'Array');
types.number = new ESType(true, 'Number');
types.any = new ESType(true, 'Any');
types.function = new ESType(true, 'Function');
types.bool = new ESType(true, 'Boolean');
types.object = new ESType(true, 'Object');
types.error = new ESType(true, 'Error');
types.any.info = {
    name: 'any',
    description: 'Matches any other type',
    file: 'built-in',
    isBuiltIn: true
};
types.number.info = {
    name: 'any',
    description: 'The ES Number type. Is a a double-precision 64-bit binary format IEEE 754 value, like double in Java and C#',
    file: 'built-in',
    isBuiltIn: true
};
types.string.info = {
    name: 'string',
    description: 'The ES String type. Holds an array of characters, and can be defined with any of \', " and `. Can be indexed like an array.',
    file: 'built-in',
    isBuiltIn: true
};
types.bool.info = {
    name: 'bool',
    description: 'The ES Bool type. Exactly two instances exist, true and false.',
    file: 'built-in',
    isBuiltIn: true
};
types.function.info = {
    name: 'function',
    description: 'The ES Function type. Is a block of code which executes when called and takes in 0+ parameters.',
    file: 'built-in',
    isBuiltIn: true
};
types.array.info = {
    name: 'array',
    description: 'The ES Array type. Defines a set of items of any type which can be accessed by an index with [].',
    file: 'built-in',
    isBuiltIn: true
};
types.object.info = {
    name: 'object',
    description: 'The ES Object type. Similar to JS objects or python dictionaries.',
    file: 'built-in',
    isBuiltIn: true
};
types.error.info = {
    name: 'error',
    description: 'The ES Error type. Call to throw an error.',
    file: 'built-in',
    isBuiltIn: true
};
types.type.info = {
    name: 'type',
    description: 'The ES Type type. Call to get the type of a value at a string.',
    file: 'built-in',
    isBuiltIn: true
};
