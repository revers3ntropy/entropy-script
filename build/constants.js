var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Context } from "./context.js";
import { ESBoolean, ESUndefined, ESType } from "./primitiveTypes.js";
export const digits = '0123456789';
export const identifierChars = '_$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const singleLineComment = '//';
export const global = new Context();
export let None;
export const setNone = (v) => void (None = v);
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
export const globalConstants = {
    'false': new ESBoolean(false),
    'true': new ESBoolean(true),
    'undefined': new ESUndefined(),
    'any': ESType.any,
    'number': ESType.number,
    'string': ESType.string,
    'bool': ESType.bool,
    'function': ESType.function,
    'array': ESType.array,
    'object': ESType.object,
    'type': ESType.type,
    'error': ESType.error,
};
export let now = () => 0;
export function refreshPerformanceNow(IS_NODE_INSTANCE) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (IS_NODE_INSTANCE) {
            // @ts-ignore
            const performance = yield import('perf_hooks');
            now = (_a = (() => { var _a; return (_a = performance === null || performance === void 0 ? void 0 : performance.performance) === null || _a === void 0 ? void 0 : _a.now(); })) !== null && _a !== void 0 ? _a : (() => 0);
        }
        else {
            now = () => {
                try {
                    return performance === null || performance === void 0 ? void 0 : performance.now();
                }
                catch (e) {
                    return 0;
                }
            };
        }
    });
}
refreshPerformanceNow(IS_NODE_INSTANCE);
