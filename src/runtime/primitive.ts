import type {ESArray} from './primitives/esarray';
import type {ESBoolean} from './primitives/esboolean';
import type {ESErrorPrimitive} from './primitives/eserrorprimitive';
import type {ESFunction} from './primitives/esfunction';
import type {ESNumber} from './primitives/esnumber';
import type {ESObject} from './primitives/esobject';
import type {ESPrimitive} from './esprimitive';
import type {ESString} from './primitives/esstring';
import type {ESType} from './primitives/estype';
import type {ESUndefined} from './primitives/esundefined';
import type { ESJSBinding } from "./primitives/esjsbinding";

export type NativeObj = any;

export type Primitive = ESPrimitive<NativeObj> | ESJSBinding | ESString | ESType | ESNumber | ESUndefined | ESBoolean | ESArray | ESObject | ESFunction | ESErrorPrimitive;