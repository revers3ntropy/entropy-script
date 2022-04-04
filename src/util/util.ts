import {Error} from '../errors';
import {Context} from '../runtime/context';
import {Node} from "../runtime/nodes";
import {ESNumber, ESPrimitive, Primitive} from '../runtime/primitiveTypes';

export type enumDict<T extends number, U> = { [k in T]: U };
export type dict<T> = { [key in (string | number | symbol)]: T; };
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

// funcProps is the props that every exposed function
// takes as a first argument
export interface funcProps {
    context: Context,
    kwargs?: dict<Primitive>
}

export type BuiltInFunction = (config: funcProps, ...args: Primitive[]) => void | Error | Primitive | Promise<void>;

/**
 * @param {any} val to be turned to string. used by .str primitive method
 * @param {number} depth
 */
export function str (val: any, depth = 0): string {
    if (typeof depth !== 'number') {
        depth = 0;
    }
    if (typeof val === 'string') {
        if (depth > 0) {
            return `'${val}'`;
        }
        return val;
    }
    if (depth > 5) {
        return '...';
    }
    let result = '';

    if (typeof val === 'undefined') {
        return 'undefined';
    }

    if (val instanceof ESPrimitive) {
        return val.str(new ESNumber(depth)).__value__;
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
                        result += str(item, depth + 1)+`, `;
                    } catch (e) {
                        result += '<large property>, '
                    }
                }
                if (val.length) {
                    result = result.substring(0, result.length - 2);
                }
                result += ']';
            } else {

                if (Object.keys(val).length < 1) {
                    return indent('{}', {indentStart: false});
                }
                result += `{\n`;
                let i = 0;
                for (let item of Object.keys(val)) {
                    result += indent(`${item}: ${str(val[item], depth + 1) || 'nil'}`);
                    if (i < Object.keys(val).length-1) {
                        result += ',\n';
                    }
                    i++;
                }
                result += '\n}';
            }
            return result;

        case "bigint":
        case "number":
        case "boolean":
            result = `${val}`;
            break;

        case "function":
            result = `<NativeFunction ${val.name}>`;
            break;
    }
    return indent(result, {
        depth: depth > 0 ? 1 : 0,
        indentStart: false
    });
}

/**
 * Returns a promise which is resolved after a set number of ms.
 * @param {number} ms
 */
export const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(() => resolve(), ms));

export function indent (str: string, {
    depth=1,
    by = 4,
    indentStart=true
} = {}) {
    let replacement = ' '.repeat(depth * by);
    return (indentStart ? replacement : '') + str.replace(/\n/g, '\n' + replacement);
}

export function generateRandomSymbol (symbols: string[], length=10) {

    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';

    const gen = (): string => {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }
    let symbol = gen();
    while (symbols.indexOf(symbol) !== -1) {
        symbol = gen();
    }
    return symbol;
}