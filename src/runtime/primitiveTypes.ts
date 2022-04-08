import type {Primitive} from './primitive';
import type {IFunctionInfo} from './info';

import {ESPrimitive} from './esprimitive';
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

    IFunctionInfo
};


export function initPrimitiveTypes () {
    types.type      = new ESType(true, 'Type');
    types.undefined = new ESType(true, 'Null');
    types.string    = new ESType(true, 'Str');
    types.array     = new ESType(true, 'Arr');
    types.number    = new ESType(true, 'Num');
    types.any       = new ESType(true, 'Any');
    types.function  = new ESType(true, 'Func');
    types.bool      = new ESType(true, 'Bool');
    types.object    = new ESType(true, 'Obj');
    types.error     = new ESType(true, 'Err');

    // Documentation for types
    types.any.__info__ = {
        name: 'Any',
        description: 'Matches any other type',
        file: 'built-in',
        builtin: true
    };
    types.number.__info__ = {
        name: 'Num',
        description: 'The ES Number type. Is a a double-precision 64-bit binary format IEEE 754 value, like double in Java and C#',
        file: 'built-in',
        builtin: true
    };
    types.string.__info__ = {
        name: 'Str',
        description: 'The ES String type. Holds an array of characters, and can be defined with any of \', " and `. Can be indexed like an array.',
        file: 'built-in',
        builtin: true
    };
    types.bool.__info__ = {
        name: 'Bool',
        description: 'The ES Bool type. Exactly two instances exist, true and false.',
        file: 'built-in',
        builtin: true
    };
    types.function.__info__ = {
        name: 'Func',
        description: 'The ES Function type. Is a block of code which executes when called and takes in 0+ parameters.',
        file: 'built-in',
        builtin: true
    };
    types.array.__info__ = {
        name: 'Arr',
        description: 'The ES Array type. Defines a set of items of any type which can be accessed by an index with [].',
        file: 'built-in',
        builtin: true
    };
    types.object.__info__ = {
        name: 'Obj',
        description: 'The ES Object type. Similar to JS objects or python dictionaries.',
        file: 'built-in',
        builtin: true
    };
    types.error.__info__ = {
        name: 'Err',
        description: 'The ES Error type. Call to throw an error.',
        file: 'built-in',
        builtin: true
    };
    types.type.__info__ = {
        name: 'Type',
        description: 'The ES Type type. Call to get the type of a value at a string.',
        file: 'built-in',
        builtin: true
    };
}
