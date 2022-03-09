import type {ESArray} from './esarray';
import type {ESBoolean} from './esboolean';
import type {ESErrorPrimitive} from './eserrorprimitive';
import type {ESFunction} from './esfunction';
import type {ESNumber} from './esnumber';
import type {ESObject} from './esobject';
import type {ESPrimitive} from './esprimitive';
import type {ESString} from './esstring';
import type {ESType} from './estype';
import type {ESUndefined} from './esundefined';
import type { ESJSBinding } from "./esjsbinding";

export type NativeObj = any;

// not very useful as | string (for custom types)
export type typeName = 'Undefined' | 'String' | 'Array' | 'Number' | 'Any' | 'Function' | 'Boolean' | 'Type' | 'Object' | string;

export type Primitive = ESPrimitive<NativeObj> | ESJSBinding | ESString | ESType | ESNumber | ESUndefined | ESBoolean | ESArray | ESObject | ESFunction | ESErrorPrimitive;

// global store of built-in types
export const types: {[key: string] : ESType} = {};