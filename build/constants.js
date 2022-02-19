var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export const digits = '0123456789';
export const identifierChars = '_$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const singleLineComment = '//';
export const multiLineCommentStart = '/*';
export const multiLineCommentEnd = '*/';
export let global;
export const setGlobalContext = (c) => void (global = c);
export const stringSurrounds = ['\'', '`', '"'];
export let IS_NODE_INSTANCE = typeof window === 'undefined';
export const runningInNode = () => void (IS_NODE_INSTANCE = true);
export const libs = {
    print: console.log
};
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
export let now = () => 0;
export function refreshPerformanceNow(IS_NODE_INSTANCE) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (IS_NODE_INSTANCE) {
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
export const importCache = {};
export var tokenType;
(function (tokenType) {
    tokenType[tokenType["NUMBER"] = 0] = "NUMBER";
    tokenType[tokenType["STRING"] = 1] = "STRING";
    tokenType[tokenType["ENDSTATEMENT"] = 2] = "ENDSTATEMENT";
    tokenType[tokenType["IDENTIFIER"] = 3] = "IDENTIFIER";
    tokenType[tokenType["KEYWORD"] = 4] = "KEYWORD";
    tokenType[tokenType["COMMA"] = 5] = "COMMA";
    tokenType[tokenType["ASSIGN"] = 6] = "ASSIGN";
    tokenType[tokenType["ADD"] = 7] = "ADD";
    tokenType[tokenType["SUB"] = 8] = "SUB";
    tokenType[tokenType["MUL"] = 9] = "MUL";
    tokenType[tokenType["DIV"] = 10] = "DIV";
    tokenType[tokenType["POW"] = 11] = "POW";
    tokenType[tokenType["OPAREN"] = 12] = "OPAREN";
    tokenType[tokenType["CPAREN"] = 13] = "CPAREN";
    tokenType[tokenType["OBRACES"] = 14] = "OBRACES";
    tokenType[tokenType["CBRACES"] = 15] = "CBRACES";
    tokenType[tokenType["OSQUARE"] = 16] = "OSQUARE";
    tokenType[tokenType["CSQUARE"] = 17] = "CSQUARE";
    tokenType[tokenType["EQUALS"] = 18] = "EQUALS";
    tokenType[tokenType["NOTEQUALS"] = 19] = "NOTEQUALS";
    tokenType[tokenType["NOT"] = 20] = "NOT";
    tokenType[tokenType["GT"] = 21] = "GT";
    tokenType[tokenType["LT"] = 22] = "LT";
    tokenType[tokenType["GTE"] = 23] = "GTE";
    tokenType[tokenType["LTE"] = 24] = "LTE";
    tokenType[tokenType["AND"] = 25] = "AND";
    tokenType[tokenType["OR"] = 26] = "OR";
    tokenType[tokenType["COLON"] = 27] = "COLON";
    tokenType[tokenType["DOT"] = 28] = "DOT";
    tokenType[tokenType["EOF"] = 29] = "EOF";
    tokenType[tokenType["BITWISE_OR"] = 30] = "BITWISE_OR";
    tokenType[tokenType["BITWISE_AND"] = 31] = "BITWISE_AND";
    tokenType[tokenType["BITWISE_NOT"] = 32] = "BITWISE_NOT";
})(tokenType || (tokenType = {}));
export let tt = tokenType;
export const tokenTypeString = {
    [tt.NUMBER]: 'Number',
    [tt.STRING]: 'String',
    [tt.ENDSTATEMENT]: ';',
    [tt.IDENTIFIER]: 'Identifier',
    [tt.KEYWORD]: 'Keyword',
    [tt.COMMA]: ',',
    [tt.OBRACES]: '{',
    [tt.CBRACES]: '}',
    [tt.OPAREN]: '(',
    [tt.CPAREN]: ')',
    [tt.OSQUARE]: '[',
    [tt.CSQUARE]: ']',
    [tt.ASSIGN]: '=',
    [tt.ADD]: '+',
    [tt.SUB]: '-',
    [tt.MUL]: '*',
    [tt.DIV]: '/',
    [tt.POW]: '^',
    [tt.EQUALS]: '==',
    [tt.NOTEQUALS]: '!=',
    [tt.NOT]: '!',
    [tt.GT]: '>',
    [tt.LT]: '<',
    [tt.GTE]: '>=',
    [tt.LTE]: '<=',
    [tt.AND]: '&&',
    [tt.OR]: '||',
    [tt.COLON]: ':',
    [tt.DOT]: '.',
    [tt.EOF]: 'End of File',
    [tt.BITWISE_AND]: '&',
    [tt.BITWISE_OR]: '|',
    [tt.BITWISE_NOT]: '~',
};
export const singleCharTokens = {
    '*': tt.MUL,
    '/': tt.DIV,
    '+': tt.ADD,
    '-': tt.SUB,
    '(': tt.OPAREN,
    ')': tt.CPAREN,
    '^': tt.POW,
    '{': tt.OBRACES,
    '}': tt.CBRACES,
    ',': tt.COMMA,
    '[': tt.OSQUARE,
    ']': tt.CSQUARE,
    ';': tt.ENDSTATEMENT,
    ':': tt.COLON,
    '.': tt.DOT,
    '=': tt.ASSIGN,
    '>': tt.GT,
    '<': tt.LT,
    '!': tt.NOT,
    '|': tt.BITWISE_OR,
    '&': tt.BITWISE_AND,
    '~': tt.BITWISE_NOT
};
export const doubleCharTokens = {
    '==': tt.EQUALS,
    '!=': tt.NOTEQUALS,
    '>=': tt.GTE,
    '<=': tt.LTE,
    '+=': tt.ASSIGN,
    '-=': tt.ASSIGN,
    '*=': tt.ASSIGN,
    '/=': tt.ASSIGN,
    '&&': tt.AND,
    '||': tt.OR
};
export const tripleCharTokens = {};
export const primitiveMethods = [
    '__add__',
    '__subtract__',
    '__multiply__',
    '__divide__',
    '__pow__',
    '__eq__',
    '__gt__',
    '__lt__',
    '__and__',
    '__or__',
    '__bool__',
    '__setProperty__',
    '__getProperty__',
    '__call__',
    'str',
    'isa',
    'is',
    'bool',
    'cast',
    'hasProperty',
];
