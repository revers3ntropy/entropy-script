export class Token {
    constructor(startPos, endPos, type, value = undefined) {
        this.type = type;
        this.value = value;
        this.startPos = startPos;
        this.endPos = endPos;
    }
    matches(type, val) {
        return this.type === type && this.value === val;
    }
}
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
    [tt.AND]: '&',
    [tt.OR]: '|',
    [tt.COLON]: ':',
    [tt.DOT]: '.',
    [tt.EOF]: 'End of File'
};
export const singleCharTokens = {
    '*': tt.MUL,
    '/': tt.DIV,
    '+': tt.ADD,
    '-': tt.SUB,
    '(': tt.OPAREN,
    ')': tt.CPAREN,
    '^': tt.POW,
    '&': tt.AND,
    '|': tt.OR,
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
};
export const tripleCharTokens = {};
