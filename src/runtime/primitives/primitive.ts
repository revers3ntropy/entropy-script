import {ESArray} from './esarray';
import {ESBoolean} from './esboolean';
import {ESErrorPrimitive} from './eserrorprimitive';
import {ESFunction} from './esfunction';
import {ESNumber} from './esnumber';
import {ESObject} from './esobject';
import {ESPrimitive} from './esprimitive';
import {ESString} from './esstring';
import {ESType} from './estype';
import {ESUndefined} from './esundefined';
import { ESJSBinding } from "./esjsbinding";

export type NativeObj = any;

// not very useful as | string (for custom types)
export type typeName = 'Undefined' | 'String' | 'Array' | 'Number' | 'Any' | 'Function' | 'Boolean' | 'Type' | 'Object' | string;

export type Primitive = ESPrimitive<NativeObj> | ESJSBinding<NativeObj> | ESString | ESType | ESNumber | ESUndefined | ESBoolean | ESArray | ESObject | ESFunction | ESErrorPrimitive;

// global store of built-in types
export const types: {[key: string] : ESType} = {};