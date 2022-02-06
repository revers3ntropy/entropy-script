import type { Context } from './runtime/context';

export const digits = '0123456789';
export const identifierChars = '_$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const singleLineComment = '//';

export let global: Context;
export const setGlobalContext = (c: Context) => void (global = c);

export const stringSurrounds = ['\'', '`', '"'];

export let IS_NODE_INSTANCE = false;
export const runningInNode = () => void (IS_NODE_INSTANCE = true);

export const KEYWORDS = [
    'var',
    'let',
    'global',
    'local',
    'mutable',
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

    'namespace',
    'export'
];

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