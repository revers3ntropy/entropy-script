import type { Error } from '../errors';
import type { Context } from '../runtime/context';
import type {
    ESArray,
    ESBoolean,
    ESErrorPrimitive,
    ESFunction,
    ESJSBinding,
    ESNull,
    ESObject,
    ESString,
    ESType
} from '../runtime/primitiveTypes';
import { Node } from "../runtime/nodes";
import { ESNumber } from '../runtime/primitiveTypes';
import { ESPrimitive } from "../runtime/primitive";
import { IDENTIFIER_CHARS, GLOBAL_CTX } from './constants';


export type EnumMap<T extends number, U=any> = {
    [key in T]: U
};

export type Map<T=any> = {
    [key in string | number | symbol]: T;
};

export interface ITimeData {
    total: number,
    lexerTotal: number,
    parserTotal: number,
    interpretTotal: number,
    nodeMax: number,
    nodeAvg: number,
    nodeTotal: number,
    interprets: number,
}

export type NativeObj = any;
export type Primitive =
    ESPrimitive<NativeObj>
    | ESJSBinding
    | ESString
    | ESType
    | ESNumber
    | ESNull
    | ESBoolean
    | ESArray
    | ESObject
    | ESFunction
    | ESErrorPrimitive;

// funcProps is the props that every exposed function
// takes as a first argument
export interface IFuncProps {
    context: Context,
    kwargs?: Map<Primitive>
    dontTypeCheck?: boolean
}

export type BuiltInFunction = (config: IFuncProps, ...args: Primitive[]) => void | Error | Primitive | Promise<void>;

/**
 * Returns a promise which is resolved after a set number of ms.
 * @param {number} ms
 */
export const sleep = (ms: number) => {
    return new Promise<void>(resolve => {
        setTimeout(resolve, ms);
    });
}

export function indent (str: string, {
    depth=1,
    by = 4,
    indentStart=true
} = {}) {
    const replacement = ' '.repeat(depth * by);
    return (indentStart ? replacement : '') + str.replace(/\n/g, '\n' + replacement);
}

export function generateRandomSymbol (symbols: string[], length=10, characters=IDENTIFIER_CHARS) {

    const gen = (): string => {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    };

    let symbol = gen();
    while (symbols.indexOf(symbol) !== -1) {
        symbol = gen();
    }

    return symbol;
}

export function str (val: unknown, depth = 0): string {
    if (typeof depth !== 'number') {
        depth = 0;
    }

    if (typeof val === 'string') {
        if (depth > 0) {
            return `'${ val }'`;
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
        return val.str({context: GLOBAL_CTX}, new ESNumber(depth)).__value__;
    }

    if (val instanceof Node) {
        return `<RunTimeNode: ${ val.constructor.name }>`;
    }

    switch (typeof val) {
        case 'object':
            if (val === null) {
                return 'nil';

            } else if (Array.isArray(val)) {
                result += '[';
                for (const item of val) {
                    try {
                        result += str(item, depth + 1) + `, `;
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
                    return indent('{}', {
                        indentStart: false
                    });
                }
                result += `{\n`;
                let i = 0;
                for (const item of Object.keys(val)) {
                    result += indent(`${ item }: ${ str((val as Map<unknown>)[item], depth + 1) || 'nil' }`);
                    if (i < Object.keys(val).length - 1) {
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
            result = `${ val }`;
            break;

        case "function":
            result = `<NativeFunction ${ val.name }>`;
            break;
    }
    return indent(result, {
        depth: depth > 0 ? 1 : 0,
        indentStart: false
    });
}