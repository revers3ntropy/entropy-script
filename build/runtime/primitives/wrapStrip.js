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
export function wrap(thing = undefined, nativeWrap = false, depth = 0) {
    if (depth >= 20) {
        return new ESUndefined();
    }
    else if (thing instanceof ESPrimitive) {
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
    else if (typeof thing == 'function') {
        return new ESFunction((p, ...args) => {
            let res;
            if (nativeWrap) {
                res = thing(...(args.map(strip)));
            }
            else {
                res = thing(p, ...args);
            }
            if (res instanceof ESError || res instanceof ESPrimitive) {
                return res;
            }
            console.log(res);
            return wrap(res, nativeWrap, depth + 1);
        });
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
    else if (typeof thing === 'object') {
        if (Array.isArray(thing)) {
            try {
                return new ESArray(thing.map(s => wrap(s, nativeWrap, depth + 1)));
            }
            catch (e) {
                return new ESArray();
            }
        }
        let newObj = {};
        for (const key in thing) {
            if (thing.hasOwnProperty(key) || typeof thing[key] == "function") {
                newObj[key] = wrap(thing[key], nativeWrap, depth + 1);
            }
        }
        return new ESObject(newObj);
    }
    else if (typeof thing === 'bigint') {
        return new ESNumber(Number(thing));
    }
    else if (typeof thing === 'symbol') {
        return new ESString(String(thing));
    }
    return new ESUndefined();
}
export function strip(thing) {
    if (thing == undefined) {
        return undefined;
    }
    else if (!(thing instanceof ESPrimitive)) {
        return thing;
    }
    else if (thing instanceof ESArray) {
        return thing.valueOf().map(m => strip(m));
    }
    else if (thing instanceof ESObject) {
        let val = {};
        for (let key in thing.valueOf())
            val[key] = strip(thing.valueOf()[key]);
        return val;
    }
    else if (thing instanceof ESUndefined) {
        return undefined;
    }
    else if (thing instanceof ESType || thing instanceof ESFunction) {
        return thing;
    }
    return thing.valueOf();
}
