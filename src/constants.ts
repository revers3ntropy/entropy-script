import {Context} from "./context.js";

export const digits = '0123456789';
export const identifierChars = '_$@abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const singleLineComment = '//';

export const global = new Context();

export class Undefined {}
export const None = new Undefined();

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

export const globalConstants: {[name: string]: any} = {
    'false': false,
    'true': true,
    'null': 0,
    'undefined': None,
    'maths': Math,
    'timer': {
        __startTime__: 0,

        start: () => {
            globalConstants.timer.__startTime__ = now();
        },
        reset: () => {
            globalConstants.timer.__startTime__ = now();
        },
        log: () => {
            console.log(`${globalConstants.timer.get()}ms`);
        },
        stop: () => {
            globalConstants.timer.__startTime__ = 0;
        },
        get: () => {
            let ms = now() - globalConstants.timer.__startTime__;
            // @ts-ignore - ms of time number not string
            return Number(ms.toPrecision(2));
        }
    }
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
