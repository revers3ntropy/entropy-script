import {Context, ESSymbol} from "./context.js";
import {ESType, Undefined} from "./type.js";

export const digits = '0123456789';
export const identifierChars = '_$@abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const singleLineComment = '//';

export const global = new Context();

export let None: ESSymbol | undefined;
export const setNone = (v: ESSymbol) => void (None = v);

export const stringSurrounds = ['\'', '`', '"'];

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

export const globalConstants: {[name: string]: [any, ESType]} = {
    'false': [false, ESType.bool],
    'true': [true, ESType.bool],
    'null': [0, ESType.undefined],
    'undefined': [new Undefined(), ESType.undefined],
    'maths': [Math, ESType.any],
    'timer': [{
        __startTime__: 0,

        start: () => {
            globalConstants.timer[0].__startTime__ = now();
        },
        reset: () => {
            globalConstants.timer[0].__startTime__ = now();
        },
        log: () => {
            console.log(`${globalConstants.timer[0].get()}ms`);
        },
        stop: () => {
            globalConstants.timer[0].__startTime__ = 0;
        },
        get: () => {
            let ms = now() - globalConstants.timer[0].__startTime__;
            // @ts-ignore - ms of time number not string
            return Number(ms.toPrecision(2));
        }
    }, ESType.any],
    'any': [ESType.any, ESType.type],
    'number': [ESType.number, ESType.type],
    'string': [ESType.string, ESType.type],
    'bool': [ESType.bool, ESType.type],
    'function': [ESType.function, ESType.type],
    'array': [ESType.array, ESType.type]
}

export let now: (() => number) = () => 0;
async function setNow () {
    now = (typeof window === 'undefined') ? () => 0 : () => performance.now();
    if (typeof window === 'undefined') {
        const performance: any = await import('perf_hooks');
        now = (() => performance?.performance?.now()) ?? (() => 0);
    }
}
setNow();