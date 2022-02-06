import {ESError} from '../errors.js';
import {Position} from '../position.js';
import {Context} from '../runtime/context.js';
import {Node} from "../runtime/nodes.js";
import {ESPrimitive, Primitive} from '../runtime/primitiveTypes.js';

export type enumDict<T extends number, U> = { [k in T]: U };
export type dict<T> = { [key in (string | number)]: T; };
export interface timeData {
    total: number,
    lexerTotal: number,
    parserTotal: number,
    interpretTotal: number,
    nodeMax: number,
    nodeAvg: number,
    nodeTotal: number,
    interprets: number,
}

export type BuiltInFunction = (config: {
    context: Context,
}, ...args: Primitive[]) => void | ESError | Primitive | Promise<void>;

/**
 * @desc opens a modal window to display a message
 * @return bool - success or failure
 * @param {any} obj
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

/**
 * @param {any} val to be turned to string. used by .str primitive method
 */
export function str (val: any, depth = 0): string {
    if (typeof val === 'string') return val;
    if (depth > 20) return '...';
    let result = '';

    if (typeof val === 'undefined')
        return 'undefined';

    if (val instanceof ESPrimitive)
        return val.str().valueOf();

    if (val instanceof Node)
        return `<RunTimeNode: ${val.constructor.name}>`;

    switch (typeof val) {
        case 'object':
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
                try {
                    result += val.constructor.name;
                } catch (e) {
                    result += 'UNKNOWN_CONSTRUCTOR';
                }

                result += ': {\n';
                let i = 0;
                for (let item in val) {
                    i++;
                    if (!val.hasOwnProperty) continue;
                    if (!val.hasOwnProperty(item)) continue;
                    result += `  ${item}: ${str(val[item], depth + 1) || ''}, \n`;
                }
                if (i > 0) result = result.substring(0, result.length - 3);
                result += '\n}\n';
            }
            break;

        case 'string':
            result = `'${val}'`;
            break;

        case "bigint":
        case "number":
        case "boolean":
            result = `${val}`;
            break;

        case "undefined":
            result = '<NativeUndefined>';
            break;

        case "function":
            result = `<NativeFunction ${val.name}>`;
            break;

    }
    for (let i = 0; i < depth; i++)
        result = indent(result);
    return result;
}

/**
 * Returns a promise which is resolved after a set number of ms.
 * @param {number} ms
 */
export const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(() => resolve(), ms));

export function indent (str: string) {
    return str.replace(/\n/g, '\n    ');
}

export const validURI = (value: string): boolean => /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);