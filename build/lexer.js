import { Position } from "./position.js";
import { digits, identifierChars, KEYWORDS, singleLineComment, stringSurrounds, } from "./constants.js";
import { IllegalCharError } from "./errors.js";
import { doubleCharTokens, singleCharTokens, Token, tripleCharTokens, tt } from "./tokens.js";
export class Lexer {
    constructor(program) {
        this.text = program;
        this.position = new Position(-1, 0, -1);
        this.advance();
    }
    advance() {
        this.position.advance(this.currentChar);
        this.currentChar = this.text[this.position.idx];
    }
    generate() {
        if (!this.text)
            return [[new Token(this.position, this.position, tt.EOF)], undefined];
        const tokens = [];
        while (this.currentChar !== undefined) {
            // add semi-colon after
            if (' \t\n'.includes(this.currentChar)) {
                this.advance();
            }
            else if (digits.includes(this.currentChar)) {
                tokens.push(this.makeNumber());
            }
            else if (this.currentChar === singleLineComment[0] &&
                this.text[this.position.idx + 1] === singleLineComment[1]) {
                this.comment();
            }
            else if (identifierChars.includes(this.currentChar)) {
                tokens.push(this.makeIdentifier());
            }
            else if (stringSurrounds.includes(this.currentChar)) {
                tokens.push(this.makeString());
            }
            else {
                const possibleAssignFirstChar = this.currentChar;
                let token = this.unknownChar();
                if (token) {
                    if (token.type === tt.ASSIGN)
                        token.value = possibleAssignFirstChar;
                    tokens.push(token);
                }
                else {
                    // unknown char
                    let startPos = this.position.clone;
                    let char = this.currentChar;
                    this.advance();
                    return [[], new IllegalCharError(startPos, this.position, char)];
                }
            }
        }
        tokens.push(new Token(this.position, this.position, tt.EOF));
        return [tokens, undefined];
    }
    makeNumber() {
        const startPos = this.position.clone;
        let numStr = '';
        let dotCount = 0;
        while (this.currentChar !== undefined && (digits + '._').includes(this.currentChar)) {
            if (this.currentChar === '.') {
                if (dotCount === 1)
                    break;
                dotCount++;
                numStr += '.';
                // use _ as a deliminator for sets of 0s - eg 1_000_000_000
            }
            else if (this.currentChar !== '_') {
                numStr += this.currentChar;
            }
            this.advance();
        }
        return new Token(startPos, this.position.clone, tt.NUMBER, parseFloat(numStr));
    }
    makeString() {
        const startPos = this.position.clone;
        let str = '';
        let strClose = this.currentChar;
        this.advance();
        while (this.currentChar !== strClose && this.currentChar !== undefined) {
            if (this.currentChar === '\\') {
                // skip over the character so that you can include the strClose string in the string
                this.advance();
                // @ts-ignore
                if (this.currentChar === 'n') {
                    str += '\n';
                    this.advance();
                    continue;
                }
            }
            str += this.currentChar;
            this.advance();
        }
        this.advance();
        return new Token(startPos, this.position.clone, tt.STRING, str);
    }
    makeIdentifier() {
        let idStr = '';
        const posStart = this.position.clone;
        while (this.currentChar !== undefined && (identifierChars + digits).includes(this.currentChar)) {
            idStr += this.currentChar;
            this.advance();
        }
        let tokType = tt.IDENTIFIER;
        if (KEYWORDS.includes(idStr))
            tokType = tt.KEYWORD;
        return new Token(posStart, this.position, tokType, idStr);
    }
    unknownChar() {
        if (this.currentChar === undefined)
            return undefined;
        for (let triple in tripleCharTokens) {
            if (triple[0] === this.currentChar)
                if (triple[1] === this.text[this.position.idx + 1])
                    if (triple[2] === this.text[this.position.idx + 2]) {
                        const startPos = this.position.clone;
                        this.advance();
                        this.advance();
                        this.advance();
                        return new Token(startPos, this.position.clone, tripleCharTokens[triple]);
                    }
        }
        for (let double in doubleCharTokens) {
            if (double[0] === this.currentChar)
                if (double[1] === this.text[this.position.idx + 1]) {
                    const startPos = this.position.clone;
                    this.advance();
                    this.advance();
                    return new Token(startPos, this.position.clone, doubleCharTokens[double]);
                }
        }
        if (singleCharTokens.hasOwnProperty(this.currentChar)) {
            let startPos = this.position.clone;
            let val = singleCharTokens[this.currentChar];
            this.advance();
            return new Token(startPos, this.position, val);
        }
        return undefined;
    }
    comment() {
        this.advance();
        while (this.currentChar !== '\n' && this.currentChar !== undefined)
            this.advance();
        this.advance();
    }
}
