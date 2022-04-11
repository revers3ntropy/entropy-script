import {Error} from '../errors';
import {ESSymbol} from './symbol';
import {ESArray} from './primitives/array';
import {ESBoolean} from './primitives/boolean';
import {ESErrorPrimitive} from './primitives/error';
import {ESFunction} from './primitives/function';
import {ESNumber} from './primitives/number';
import {ESObject} from './primitives/object';
import {ESPrimitive} from './primitive';
import {ESString} from './primitives/string';
import {ESType} from './primitives/type';
import {ESNull} from './primitives/null';
import { ESJSBinding } from "./primitives/jsbinding";
import { Map, IFuncProps, Primitive, NativeObj } from '../util/util';

/**
 * Wrap anything in primitive.
 * If it is already a primitive, it is returned immediately.
 */
export function wrap (thing: any, functionsTakeProps=false): Primitive {
    if (thing instanceof ESPrimitive) {
        return thing;

    } else if (thing === undefined || thing === null) {
        return new ESNull();

    } else if (thing instanceof Error) {
        return new ESErrorPrimitive(thing);

    } else if (thing instanceof ESSymbol) {
        return thing.value;

    } else if (typeof thing === 'number') {
        return new ESNumber(thing);

    } else if (typeof thing === 'string') {
        return new ESString(thing);

    } else if (typeof thing === 'boolean') {
        return new ESBoolean(thing);

    } else if (typeof thing === 'bigint') {
        return new ESNumber(Number(thing));

    } else if (typeof thing === 'symbol') {
        return new ESString(String(thing));

    } else if (Array.isArray(thing)) {
        return new ESArray(thing.map(o => wrap(o, functionsTakeProps)));
    }
    // catch objects, functions and other
    return new ESJSBinding(thing, undefined, functionsTakeProps);
}

/**
 * Returns the thing passed in its js form.
 * If it's not a primitive, it is returned immediately.
 */
export function strip (thing: Primitive | undefined, props: IFuncProps): NativeObj {
    if (!(thing instanceof ESPrimitive)) {
        return thing;

    } else if (thing instanceof ESArray) {
        return thing.__value__.map(m => strip(m, props), props);

    } else if (thing instanceof ESObject) {
        const val: Map<NativeObj> = {};
        for (const key in thing.__value__) {
            val[key] = strip(thing.__value__[key], props);
        }
        return val;

    } else if (thing instanceof ESNull) {
        return undefined;

    } else if (thing instanceof ESFunction) {
        return (...args: any[]): any => {
            const res = thing.__call__(props, ...args.map(a => wrap(a)));
            if (res instanceof Error) {
                console.error(res.str);
                return res;
            }
            return strip(res, props);
        };

    } else if (thing instanceof ESType) {
        return thing;
    }

    return thing.__value__;
}