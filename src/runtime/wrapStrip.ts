import {Error} from '../errors';
import {ESSymbol} from './symbol';
import {ESArray} from './primitives/esarray';
import {ESBoolean} from './primitives/esboolean';
import {ESErrorPrimitive} from './primitives/eserrorprimitive';
import {ESFunction} from './primitives/esfunction';
import {ESNumber} from './primitives/esnumber';
import {ESObject} from './primitives/esobject';
import {ESPrimitive} from './esprimitive';
import {ESString} from './primitives/esstring';
import {ESType} from './primitives/estype';
import {ESUndefined} from './primitives/esundefined';
import type {NativeObj, Primitive} from './primitive';
import { ESJSBinding } from "./primitives/esjsbinding";
import {dict, funcProps} from '../util/util';

/**
 * @param {any} thing
 * @param {boolean} functionsTakeProps
 * @returns {Primitive}
 */
export function wrap (thing: any, functionsTakeProps=false): Primitive {
    if (thing instanceof ESPrimitive) {
        return thing;

    } else if (thing === undefined || thing === null) {
        return new ESUndefined();

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
 * Returns the thing passed in its js form
 */
export function strip (thing: Primitive | undefined, props: funcProps): NativeObj {
    if (!(thing instanceof ESPrimitive)) {
        return thing;

    } else if (thing instanceof ESArray) {
        return thing.__value__.map(m => strip(m, props), props);

    } else if (thing instanceof ESObject) {
        const val: dict<NativeObj> = {};
        for (const key in thing.__value__) {
            val[key] = strip(thing.__value__[key], props);
        }
        return val;

    } else if (thing instanceof ESUndefined) {
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