import {Node} from "../runtime/nodes.js";
import { ESPrimitive } from "../runtime/primitiveTypes.js";

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

// @ts-ignore
Array.prototype.includes = function (element: any) {
    return this.indexOf(element) !== -1;
};

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
                    if (!['this', 'this_', 'constructor', 'self'].includes(item)) {
                        result += `  ${item}: ${str(val[item], depth + 1) || ''}, \n`;
                    }
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
    return result;
}

/**
 * Returns a promise which is resolved after a set number of ms.
 * @param {number} ms
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * from https://gist.github.com/zensh/4975495
 * @param obj
 */
export function memorySizeOf(obj: any) {
    let bytes = 0;

    function sizeOf(obj: any) {
        if(obj !== null && obj !== undefined) {
            switch(typeof obj) {
                case 'number':
                    bytes += 8;
                    break;
                case 'string':
                    bytes += obj.length * 2;
                    break;
                case 'boolean':
                    bytes += 4;
                    break;
                case 'object':
                    let objClass = Object.prototype.toString.call(obj).slice(8, -1);
                    if (objClass === 'Object' || objClass === 'Array') {
                        for (const key in obj) {
                            if(!obj.hasOwnProperty(key)) continue;
                            sizeOf(obj[key]);
                        }
                    } else bytes += obj.toString().length * 2;
                    break;
            }
        }
        return bytes;
    }

    function formatByteSize(bytes: number) {
        if(bytes < 1024) return bytes + " bytes";
        else if(bytes < 1048576) return(bytes / 1024).toFixed(3) + " KiB";
        else if(bytes < 1073741824) return(bytes / 1048576).toFixed(3) + " MiB";
        else return(bytes / 1073741824).toFixed(3) + " GiB";
    }

    return formatByteSize(sizeOf(obj));
}
