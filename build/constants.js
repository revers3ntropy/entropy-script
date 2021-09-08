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
export const digits = '0123456789';
export const identifierChars = '_$@abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const singleLineComment = '//';
export const global = new Context();
export class Undefined {
}
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
export const globalConstants = {
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
};
export let now = () => 0;
function setNow() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        now = (typeof window === 'undefined') ? () => 0 : () => performance.now();
        if (typeof window === 'undefined') {
            const performance = yield import('perf_hooks');
            now = (_a = (() => { var _a; return (_a = performance === null || performance === void 0 ? void 0 : performance.performance) === null || _a === void 0 ? void 0 : _a.now(); })) !== null && _a !== void 0 ? _a : (() => 0);
        }
    });
}
setNow();
