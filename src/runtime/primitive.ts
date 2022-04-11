import type {ESArray} from './primitives/array';
import type {ESBoolean} from './primitives/boolean';
import type {ESErrorPrimitive} from './primitives/error';
import type {ESFunction} from './primitives/function';
import type {ESNumber} from './primitives/number';
import type {ESObject} from './primitives/object';
import type {ESPrimitive} from './esprimitive';
import type {ESString} from './primitives/string';
import type {ESType} from './primitives/type';
import type {ESNull} from './primitives/null';
import type { ESJSBinding } from "./primitives/jsbinding";

export type NativeObj = any;

export type Primitive = ESPrimitive<NativeObj> | ESJSBinding | ESString | ESType | ESNumber | ESNull | ESBoolean | ESArray | ESObject | ESFunction | ESErrorPrimitive;