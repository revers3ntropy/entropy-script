import {ESArray} from './esarray.js';
import {ESBoolean} from './esboolean.js';
import {ESErrorPrimitive} from './eserrorprimitive.js';
import {ESFunction} from './esfunction.js';
import {ESNumber} from './esnumber.js';
import {ESObject} from './esobject.js';
import {ESPrimitive} from './esprimitive.js';
import {ESString} from './esstring.js';
import {ESType} from './estype.js';
import {ESUndefined} from './esundefined.js';

export type typeName = 'Undefined' | 'String' | 'Array' | 'Number' | 'Any' | 'Function' | 'Boolean' | 'Type' | 'Object' | string;
export type Primitive = ESPrimitive<any> | ESString | ESType | ESNumber | ESUndefined | ESBoolean | ESArray | ESObject | ESFunction | ESErrorPrimitive;
export const types: {[key: string] : ESType} = {};