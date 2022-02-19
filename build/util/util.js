import { Node } from "../runtime/nodes.js";
import { ESPrimitive } from '../runtime/primitiveTypes.js';
export function deepClone(obj, hash = new WeakMap()) {
    if (Object(obj) !== obj || obj instanceof Function)
        return obj;
    if (hash.has(obj))
        return hash.get(obj);
    try {
        var result = new obj.constructor();
    }
    catch (e) {
        result = Object.create(Object.getPrototypeOf(obj));
    }
    if (obj instanceof Map)
        Array.from(obj, ([key, val]) => result.set(deepClone(key, hash), deepClone(val, hash)));
    else if (obj instanceof Set)
        Array.from(obj, (key) => result.add(deepClone(key, hash)));
    hash.set(obj, result);
    return Object.assign(result, ...Object.keys(obj).map(key => ({ [key]: deepClone(obj[key], hash) })));
}
export function str(val, depth = 0) {
    if (typeof val === 'string') {
        return val;
    }
    if (depth > 20) {
        return '...';
    }
    let result = '';
    if (typeof val === 'undefined') {
        return 'undefined';
    }
    if (val instanceof ESPrimitive) {
        return val.str().valueOf();
    }
    if (val instanceof Node) {
        return `<RunTimeNode: ${val.constructor.name}>`;
    }
    switch (typeof val) {
        case 'object':
            if (Array.isArray(val)) {
                result += '[';
                for (let item of val) {
                    try {
                        result += str(item, depth + 1) + `, `;
                    }
                    catch (e) {
                        result += '<large property>, ';
                    }
                }
                if (val.length) {
                    result = result.substring(0, result.length - 2);
                }
                result += ']';
            }
            else {
                try {
                    result += val.constructor.name;
                }
                catch (e) {
                    result += 'UNKNOWN_CONSTRUCTOR';
                }
                result += ': {\n';
                let i = 0;
                for (let item in val) {
                    i++;
                    if (!val.hasOwnProperty)
                        continue;
                    if (!val.hasOwnProperty(item))
                        continue;
                    result += `  ${item}: ${str(val[item], depth + 1) || ''}, \n`;
                }
                if (i > 0)
                    result = result.substring(0, result.length - 3);
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
    for (let i = 0; i < depth; i++) {
        result = indent(result);
    }
    return result;
}
export const sleep = (ms) => new Promise(resolve => setTimeout(() => resolve(), ms));
export function indent(str) {
    return str.replace(/\n/g, '\n    ');
}
export const validURI = (value) => /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
