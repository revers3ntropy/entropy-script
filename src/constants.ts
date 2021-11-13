import {Context, ESSymbol} from "./context.js";
import { ESBoolean, ESUndefined, Primitive, types, ESErrorPrimitive } from "./primitiveTypes.js";

export const digits = '0123456789';
export const identifierChars = '_$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const singleLineComment = '//';

export const global = new Context();

export let None: ESSymbol | undefined;
export const setNone = (v: ESSymbol) => void (None = v);

export const stringSurrounds = ['\'', '`', '"'];

export let IS_NODE_INSTANCE = false;
export const runningInNode = () => void (IS_NODE_INSTANCE = true);

export const KEYWORDS = [
    'var',
    'global',
    'let',
    'const',

    'if',
    'else',

    'while',
    'for',
    'in',
    'continue',
    'break',

    'func',
    'return',
    'yield',

    'class',
    'extends',
];

export const globalConstants: {[name: string]: Primitive} = {
    'false': new ESBoolean(false),
    'true': new ESBoolean(true),
    'undefined': new ESUndefined(),
    'any': types.any,
    'number': types.number,
    'string': types.string,
    'bool': types.bool,
    'function': types.function,
    'array': types.array,
    'object': types.object,
    'type': types.type,
    'error': types.error,
    'maths': ESErrorPrimitive.wrap(Math)
}

export let now: (() => number) = () => 0;
export async function refreshPerformanceNow (IS_NODE_INSTANCE: boolean) {
    if (IS_NODE_INSTANCE) {
        // @ts-ignore
        const performance: any = await import('perf_hooks');
        now = (() => performance?.performance?.now()) ?? (() => 0);

    } else {
        now = () => {
            try {
                return performance?.now();
            } catch (e) {
                return 0;
            }
        };
    }
}
refreshPerformanceNow(IS_NODE_INSTANCE);