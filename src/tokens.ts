import {Position} from "./position.js";
import {enumDict} from "./util.js";

export class Token {
    type: tokenType;
    value: any;
    startPos: Position;

    constructor (startPos: Position, type: tokenType, value: any = undefined) {
        this.type = type;
        this.value = value;
        this.startPos = startPos;
    }

    public matches(type: tokenType, val: any) {
        return this.type === type && this.value === val;
    }
}

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