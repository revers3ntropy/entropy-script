import { str } from "./util.js";
import * as n from './nodes.js';
import { digits, None, Undefined } from "./constants.js";
import { ESError } from "./errors.js";
import { Position } from "./position.js";
export const builtInFunctions = {
    'range': context => {
        let n = context.get('n');
        if (n instanceof Undefined)
            n = undefined;
        try {
            return [...Array(n).keys()];
        }
        catch (e) {
            return new ESError(Position.unknown, Position.unknown, 'RangeError', `Cannot make range of length '${str(n)}'`);
        }
    },
    'log': context => {
        var _a;
        let msg = (_a = context.get('message')) !== null && _a !== void 0 ? _a : '';
        console.log(msg);
        return context.get('message');
    },
    'str': context => {
        let val = context.get('val');
        return str(val);
    },
    'type': context => {
        var _a;
        let val = context.get('val');
        switch (typeof val) {
            case "function":
                return 'function';
            case "boolean":
                return 'bool';
            case "number":
                return 'number';
            case "string":
                return 'string';
            case "undefined":
                return 'undefined';
            case "object":
                if (val instanceof n.N_function)
                    return 'function';
                else if (val instanceof n.N_class)
                    return 'type';
                else if (val instanceof Undefined)
                    return 'undefined';
                else if (Array.isArray(val))
                    return 'array';
                return (_a = val.constructor.name) !== null && _a !== void 0 ? _a : 'object';
            default:
                return typeof val;
        }
    },
    'contains': context => {
        let arr = context.get('arr');
        if (!Array.isArray(arr))
            return false;
        return ((~arr.indexOf(context.get('element'))) || None) || false;
    },
    'append': context => {
        let arr = context.get('arr');
        if (!Array.isArray(arr))
            return arr;
        for (let item of context.get('args')) {
            arr.push(item);
        }
        return arr;
    },
    'strLower': context => {
        var _a;
        return ((_a = context.get('args')[0]) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
    },
    'strUpper': context => {
        var _a;
        return ((_a = context.get('args')[0]) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
    },
    'parseNum': context => {
        let str = context.get('number');
        if (typeof str == 'number')
            return str;
        let idx = 0;
        let numStr = '';
        let dotCount = 0;
        while (str[idx] !== undefined && (digits + '._').includes(str[idx])) {
            if (str[idx] === '.') {
                if (dotCount === 1)
                    break;
                dotCount++;
                numStr += '.';
                // use _ as a deliminator for sets of 0s - eg 1_000_000_000
            }
            else {
                numStr += str[idx];
            }
            idx++;
        }
        if (dotCount === 0)
            return parseInt(numStr);
        return parseFloat(numStr);
    },
    'throw': context => {
        return new ESError(Position.unknown, Position.unknown, 'Thrown Error', 'Thrown error in code');
    },
    'len': context => {
        let total = 0;
        for (let item of context.get('args')) {
            if (typeof item === 'string' || Array.isArray(item)) {
                total += item.length;
            }
            else if (typeof item === 'object') {
                for (let prop in item)
                    total++;
            }
            else
                total++;
        }
        return total;
    }
};
export const builtInArgs = {
    'add': ['a', 'b'],
    'range': ['n'],
    'log': ['message'],
    'str': ['val'],
    'type': ['val'],
    'input': ['msg', 'cb'],
    'import': ['url'],
    'contains': ['arr', 'element'],
    'parseNum': ['number'],
    'append': ['arr'],
};
