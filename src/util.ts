import {Undefined} from "./constants.js";
import {Node} from "./nodes.js";

export type enumDict<T extends number, U> = { [K in T]: U };

/**
 * @desc opens a modal window to display a message
 * @return bool - success or failure
 * @param obj
 * @param hash
 */
export function deepClone(obj: any, hash = new WeakMap()): any {
    // Do not try to clone primitives or functions
    if (Object(obj) !== obj || obj instanceof Function)
        return obj;
    if (hash.has(obj))
        return hash.get(obj); // Cyclic reference
    try { // Try to run constructor (without arguments, as we don't know them)
        var result = new obj.constructor();
    }
    catch (e) { // Constructor failed, create object without running the constructor
        result = Object.create(Object.getPrototypeOf(obj));
    }
    // Optional: support for some standard constructors (extend as desired)
    if (obj instanceof Map)
        Array.from(obj, ([key, val]) => result.set(deepClone(key, hash), deepClone(val, hash)));
    else if (obj instanceof Set)
        Array.from(obj, (key) => result.add(deepClone(key, hash)));
    // Register in hash
    hash.set(obj, result);
    // Clone and assign enumerable own properties recursively
    return Object.assign(result, ...Object.keys(obj).map(key => ({ [key]: deepClone(obj[key], hash) })));
}

export function str (val: any, depth = 0): string {
    if (typeof val === 'string') return val;
    if (depth > 20) return '...';
    let result = '';

    if (typeof val === 'undefined')
        return 'undefined';

    if (val instanceof Undefined) {
        return 'Undefined';
    }

    if (val instanceof Node) {
        return val.constructor.name;
    }

    if (typeof val === 'object') {
        if (Array.isArray(val)) {
            result += '[';
            for (let item of val) {
                try {
                    result += str(item, depth + 1)+`, `;
                }
                catch (e) {
                    result += '<large property>, '
                }
            }
            if (val.length)
                result = result.substring(0, result.length - 2);
            result += ']';
        } else {
            result += val.constructor.name;
            result += ': ';
            result += '{';
            let i = 0;
            for (let item in val) {
                i++;
                if (val.hasOwnProperty(item) && !['this', 'this_', 'constructor', 'self'].includes(item))
                    result += `${item}: ${str(val[item], depth + 1) || ''}, `;
            }
            if (i) result = result.substring(0, result.length - 2);
            result += '}';
        }
    } else if (typeof val === 'string' && depth !== 0) {
        result = `'${val}'`;
    } else {
        result = `${val}`;
    }

    return result;
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
