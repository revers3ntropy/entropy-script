import type { Context } from '../runtime/context';
import type { NativeObj } from '../runtime/primitive';
import type { Map, EnumMap } from './util';
import type { ESType } from "../runtime/primitives/estype";

// @ts-ignore
import PACKAGE_JSON from '../../package.json';

export const DIGITS = '0123456789';
export const IDENTIFIER_CHARS = '_$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const ONE_LINE_COMMENT = '//';
export const MULTI_LINE_COMMENT_START = '/*';
export const MULTI_LINE_COMMENT_END = '*/';
export const WHITESPACE = ' \t\n';

export let GLOBAL_CTX: Context;
export const setGlobalContext = (c: Context) => {
    GLOBAL_CTX = c;
};

export const STRING_SURROUNDS = ['\'', '`', '"'];

export let IS_NODE_INSTANCE = typeof window === 'undefined';
export const runningInNode = () => void (IS_NODE_INSTANCE = true);

export const VAR_DECLARE_KEYWORDS = ['let'];

export const VERSION = PACKAGE_JSON['version'];

export const CONFIG_FILE_NAME = 'esconfig.json';

export const VALID_FILE_ENCODINGS: string[] = [
    'utf8', 'ucs2', 'utf16le', 'latin1',
    'ascii', 'base64', 'base64url', 'hex'
];

export interface ICompileConfig {
    minify: boolean,
    indent: number,
    symbols: string[]
}

// global store of built-in types like 'String' and 'Type'
export const types: Map<ESType> = {};

// global object of all native dependencies like node-fetch and fs.
export const libs: Map<NativeObj> = {};

export const CATCH_BLOCK_ERR_SYMBOL_ID = 'err';

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

    'abstract',
    'class',
    'extends',

    'namespace',

    'try',
    'catch'
];

export const CLASS_KEYWORDS = [
    'class',
    'abstract'
];

export let now = () => Date.now();
export function refreshPerformanceNow (isNode = IS_NODE_INSTANCE) {
    if (!isNode) {
        now = () => {
            try {
                return performance?.now();
            } catch (e) {
                return Date.now();
            }
        };
    } else {
        now = () => Date.now();
    }
}
refreshPerformanceNow();

export enum TokenType {
    NUMBER,
    STRING,

    END_STATEMENT,

    IDENTIFIER,
    KEYWORD,

    COMMA,

    ASSIGN,

    ADD,
    SUB,
    ASTRIX,
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
    NOT_EQUALS,
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
    AMPERSAND,
    BITWISE_NOT,
    QM,

    OGENERIC,
    CGENERIC
}

export const tt = TokenType;

export const ttToStr: EnumMap<TokenType, string> = {
    [tt.NUMBER]: 'Number',
    [tt.STRING]: 'String',
    [tt.END_STATEMENT]: ';',

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
    [tt.ASTRIX]: '*',
    [tt.DIV]: '/',
    [tt.POW]: '^',
    [tt.MOD]: '%',

    [tt.EQUALS]: '==',
    [tt.NOT_EQUALS]: '!=',
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

    [tt.AMPERSAND]: '&',
    [tt.PIPE]: '|',
    [tt.BITWISE_NOT]: '~',
    [tt.QM]: '?',

    [tt.OGENERIC]: '<|',
    [tt.CGENERIC]: '|>'
}

export const SINGLE_TOKENS: Map<TokenType> = {
    '*': tt.ASTRIX,
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
    ';': tt.END_STATEMENT,
    ':': tt.COLON,
    '.': tt.DOT,
    '=': tt.ASSIGN,
    '>': tt.GT,
    '<': tt.LT,
    '!': tt.NOT,
    '|': tt.PIPE,
    '&': tt.AMPERSAND,
    '~': tt.BITWISE_NOT,
    '?': tt.QM
};

export const DOUBLE_TOKENS: Map<TokenType> = {
    '==': tt.EQUALS,
    '!=': tt.NOT_EQUALS,
    '>=': tt.GTE,
    '<=': tt.LTE,
    '+=': tt.ASSIGN,
    '-=': tt.ASSIGN,
    '*=': tt.ASSIGN,
    '/=': tt.ASSIGN,
    '&&': tt.AND,
    '||': tt.OR,
    '<|': tt.OGENERIC,
    '|>': tt.CGENERIC
};

export const TRIPLE_TOKENS: Map<TokenType> = {};

export const PROPS_TO_OVERRIDE_ON_PRIM: string[] = [
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
    '__set__',
    '__get__',
    '__call__',
    '__iter__',
    '__next__',
    '__iterable__'
];


// @ts-ignore
import STD_ITER from 'raw-loader!../built-in/std/iter.es';
// @ts-ignore
import STD_TEST from 'raw-loader!../built-in/std/test.es';

export const STD_RAW: string[] = [
    STD_ITER,
    STD_TEST
];