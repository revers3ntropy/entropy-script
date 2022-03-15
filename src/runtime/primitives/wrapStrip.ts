import {ESError} from '../../errors';
import {ESSymbol} from '../symbol';
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
import type {NativeObj, Primitive} from './primitive';
import { ESJSBinding } from "./esjsbinding";
import { funcProps } from "../../util/util";

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

    } else if (thing instanceof ESError) {
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
        return thing.valueOf().map(m => strip(m, props), props);

    } else if (thing instanceof ESObject) {
        let val: { [key: string]: NativeObj } = {};
        for (let key in thing.valueOf()) {
            val[key] = strip(thing.valueOf()[key], props);
        }
        return val;

    } else if (thing instanceof ESUndefined) {
        return undefined;

    } else if (thing instanceof ESFunction) {
        return (...args: any[]): any => {
            const res = thing.__call__(props, ...args.map(a => wrap(a)));
            if (res instanceof ESError) {
                console.error(res.str);
                return res;
            }
            return strip(res, props);
        };

    } else if (thing instanceof ESType) {
        return thing;
    }

    return thing.valueOf();
}