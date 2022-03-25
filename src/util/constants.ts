import type { Context } from '../runtime/context';
import type { dict, enumDict } from './util';
import type { ESType } from "../runtime/primitives/estype";

// @ts-ignore
import PACKAGE_JSON from '../../package.json';

export const digits = '0123456789';
export const identifierChars = '_$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const singleLineComment = '//';
export const multiLineCommentStart = '/*';
export const multiLineCommentEnd = '*/';

export let global: Context;
export const setGlobalContext = (c: Context) => {
    global = c;
};

export const stringSurrounds = ['\'', '`', '"'];

export let IS_NODE_INSTANCE = typeof window === 'undefined';
export const runningInNode = () => void (IS_NODE_INSTANCE = true);

export const VAR_DECLARE_KEYWORDS = ['var', 'let', 'global'];

export const VERSION = PACKAGE_JSON['version'];

export const configFileName = 'esconfig.json';

export const VALID_FILE_ENCODINGS: string[] = [
    'utf8', 'ucs2', 'utf16le', 'latin1',
    'ascii', 'base64', 'base64url', 'hex'
];

export interface compileConfig {
    minify: boolean,
    indent: number,
    symbols: string[]
}

// global store of built-in types like 'String' and 'Type'
export const types: dict<ESType> = {};

// global object of all native dependencies like node-fetch and fs.
export const libs: dict<any> = {};

export const catchBlockErrorSymbolName = 'err';

export const KEYWORDS = [
    'var',
    'let',
    'global',

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

    'try',
    'catch'
];

export let now: (() => number) = () => 0;
export async function refreshPerformanceNow (IS_NODE_INSTANCE: boolean) {
    if (IS_NODE_INSTANCE) {
        now = () => Date.now();

    } else {
        now = () => {
            try {
                return performance?.now();
            } catch (e) {
                return Date.now();
            }
        };
    }
}
refreshPerformanceNow(IS_NODE_INSTANCE);

export enum tokenType {
    NUMBER,
    STRING,

    ENDSTATEMENT,

    IDENTIFIER,
    KEYWORD,

    COMMA,

    ASSIGN,

    ADD,
    SUB,
    MUL,
    DIV,
    POW,
    MOD,

    OPAREN,
    CPAREN,
    OBRACES,
    CBRACES,
    OSQUARE,
    CSQUARE,

    EQUALS,
    NOTEQUALS,
    NOT,
    GT,
    LT,
    GTE,
    LTE,
    AND,
    OR,

    COLON,
    DOT,

    EOF,

    PIPE,
    APMERSAND,
    BITWISE_NOT,
    QM
}

export let tt = tokenType;

export const tokenTypeString: enumDict<tokenType, string> = {
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
    [tt.MOD]: '%',

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

    [tt.APMERSAND]: '&',
    [tt.PIPE]: '|',
    [tt.BITWISE_NOT]: '~',
    [tt.QM]: '?',
}

export const singleCharTokens: {[char: string]: tokenType} = {
    '*': tt.MUL,
    '/': tt.DIV,
    '+': tt.ADD,
    '-': tt.SUB,
    '(': tt.OPAREN,
    ')': tt.CPAREN,
    '^': tt.POW,
    '%': tt.MOD,
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
    '|': tt.PIPE,
    '&': tt.APMERSAND,
    '~': tt.BITWISE_NOT,
    '?': tt.QM
};

export const doubleCharTokens: {[char: string]: tokenType} = {
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

export const tripleCharTokens: {[char: string]: tokenType} = {};

export const primitiveMethods: string[] = [
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
    '__pipe__',
    '__ampersand__',
    '__bool__',
    '__set_property__',
    '__get_property__',
    '__call__',
];