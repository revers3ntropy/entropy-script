import type {Primitive} from './primitives/primitive';
import type {FunctionInfo} from './primitives/info';

import {ESPrimitive} from './primitives/esprimitive';
import {ESArray} from './primitives/esarray';
import {ESBoolean} from './primitives/esboolean';
import {ESErrorPrimitive} from './primitives/eserrorprimitive';
import {ESFunction} from './primitives/esfunction';
import {ESNumber} from './primitives/esnumber';
import {ESObject} from './primitives/esobject';
import {ESString} from './primitives/esstring';
import {ESType} from './primitives/estype';
import {ESUndefined} from './primitives/esundefined';
import {ESNamespace} from './primitives/esnamespace';
import {ESJSBinding} from "./primitives/esjsbinding";

import {types} from "../util/constants";

export {
    ESArray,
    ESBoolean,
    ESErrorPrimitive,
    ESFunction,
    ESNumber,
    ESPrimitive,
    ESString,
    ESObject,
    ESType,
    ESUndefined,
    ESNamespace,
    ESJSBinding,

    Primitive,

    FunctionInfo
};


export function initPrimitiveTypes () {
    types.type      = new ESType(true, 'Type');
    types.undefined = new ESType(true, 'Undefined');
    types.string    = new ESType(true, 'String');
    types.array     = new ESType(true, 'Array');
    types.number    = new ESType(true, 'Number');
    types.any       = new ESType(true, 'Any');
    types.function  = new ESType(true, 'Function');
    types.bool      = new ESType(true, 'Boolean');
    types.object    = new ESType(true, 'Object');
    types.error     = new ESType(true, 'Error');

    // Documentation for types
    types.any.info = {
        name: 'Any',
        description: 'Matches any other type',
        file: 'built-in',
        isBuiltIn: true
    };
    types.number.info = {
        name: 'Number',
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
        name: 'Bool',
        description: 'The ES Bool type. Exactly two instances exist, true and false.',
        file: 'built-in',
        isBuiltIn: true
    };
    types.function.info = {
        name: 'Func',
        description: 'The ES Function type. Is a block of code which executes when called and takes in 0+ parameters.',
        file: 'built-in',
        isBuiltIn: true
    };
    types.array.info = {
        name: 'Array',
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
        name: 'Error',
        description: 'The ES Error type. Call to throw an error.',
        file: 'built-in',
        isBuiltIn: true
    };
    types.type.info = {
        name: 'Type',
        description: 'The ES Type type. Call to get the type of a value at a string.',
        file: 'built-in',
        isBuiltIn: true
    };
}
