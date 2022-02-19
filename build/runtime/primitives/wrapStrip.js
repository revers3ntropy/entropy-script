import { ESError } from '../../errors.js';
import { ESSymbol } from '../symbol.js';
import { ESArray } from './esarray.js';
import { ESBoolean } from './esboolean.js';
import { ESErrorPrimitive } from './eserrorprimitive.js';
import { ESFunction } from './esfunction.js';
import { ESNumber } from './esnumber.js';
import { ESObject } from './esobject.js';
import { ESPrimitive } from './esprimitive.js';
import { ESString } from './esstring.js';
import { ESType } from './estype.js';
import { ESUndefined } from './esundefined.js';
import { ESJSBinding } from "./esjsbinding.js";
export function wrap(thing, functionsTakeProps = false) {
    if (thing instanceof ESPrimitive) {
        return thing;
    }
    else if (thing === undefined || thing === null) {
        return new ESUndefined();
    }
    else if (thing instanceof ESError) {
        return new ESErrorPrimitive(thing);
    }
    else if (thing instanceof ESSymbol) {
        return thing.value;
    }
    else if (typeof thing === 'number') {
        return new ESNumber(thing);
    }
    else if (typeof thing === 'string') {
        return new ESString(thing);
    }
    else if (typeof thing === 'boolean') {
        return new ESBoolean(thing);
    }
    else if (typeof thing === 'bigint') {
        return new ESNumber(Number(thing));
    }
    else if (typeof thing === 'symbol') {
        return new ESString(String(thing));
    }
    return new ESJSBinding(thing, undefined, functionsTakeProps);
}
export function strip(thing, props) {
    if (thing == undefined) {
        return undefined;
    }
    else if (!(thing instanceof ESPrimitive)) {
        return thing;
    }
    else if (thing instanceof ESArray) {
        return thing.valueOf().map(m => strip(m, props), props);
    }
    else if (thing instanceof ESObject) {
        let val = {};
        for (let key in thing.valueOf())
            val[key] = strip(thing.valueOf()[key], props);
        return val;
    }
    else if (thing instanceof ESUndefined) {
        return undefined;
    }
    else if (thing instanceof ESFunction) {
        return (...args) => {
            const res = thing.__call__(props, ...args.map(a => wrap(a)));
            if (res instanceof ESError) {
                return res;
            }
            return strip(res, props);
        };
    }
    else if (thing instanceof ESType) {
        return thing;
    }
    return thing.valueOf();
}
