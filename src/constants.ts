import {JSModuleParams} from './built-in/module';
import type { Context } from './runtime/context';
import {dict, enumDict} from './util/util';
import {ESNamespace} from './runtime/primitiveTypes';

export const digits = '0123456789';
export const identifierChars = '_$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const singleLineComment = '//';
export const multiLineCommentStart = '/*';
export const multiLineCommentEnd = '*/';

export let global: Context;
export const setGlobalContext = (c: Context) => void (global = c);

export const stringSurrounds = ['\'', '`', '"'];

export let IS_NODE_INSTANCE = typeof window === 'undefined';
export const runningInNode = () => void (IS_NODE_INSTANCE = true);

export const VAR_DECLARE_KEYWORDS = ['var', 'let', 'global', 'mutable', 'const', 'local'];

// @ts-ignore
import PACKAGE_JSON from '../package.json';
export const VERSION = PACKAGE_JSON['version'];

export interface compileConfig {
    minify: boolean,
    indent: number,
    symbols: string[]
}

export interface Permissions {
    networking: boolean;
    imports: boolean;
    accessDOM: boolean;
    useSTD: boolean;
    fileSystem: boolean,

    [k: string]: any
}

export let permissions: Permissions = {
    networking: false,
    imports: true,
    accessDOM: false,
    useSTD: true,
    fileSystem: false,
};

export function updatePermissions (newPermissions: any) {
    permissions = {
        ...permissions,
        ...newPermissions
    };
}

export const libs: JSModuleParams = {
    print: console.log
};

export const catchBlockErrorSymbolName = 'err';

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
    'export',

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
                return 0;
            }
        };
    }
}
refreshPerformanceNow(IS_NODE_INSTANCE);

export const importCache: dict<ESNamespace> = {};

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

    BITWISE_OR,
    BITWISE_AND,
    BITWISE_NOT,
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

    [tt.BITWISE_AND]: '&',
    [tt.BITWISE_OR]: '|',
    [tt.BITWISE_NOT]: '~',
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
    '|': tt.BITWISE_OR,
    '&': tt.BITWISE_AND,
    '~': tt.BITWISE_NOT
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

export const tripleCharTokens: {[char: string]: tokenType} = {

};

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
    '__bool__',
    '__setProperty__',
    '__getProperty__',
    '__call__',
];