import Position from "../position";
import {
    digits, doubleCharTokens,
    identifierChars,
    KEYWORDS, multiLineCommentEnd, multiLineCommentStart, singleCharTokens,
    singleLineComment,
    stringSurrounds, tripleCharTokens, tt,
} from '../util/constants';
import {Error, IllegalCharError} from "../errors";
import {Token} from "./tokens";

function isDigit (n: string) {
    return (digits+'._').includes(n);
}

export class Lexer {
    private readonly text: string;
    private currentChar: string | undefined;
    private readonly position: Position;

    constructor (program: string, fileName: string) {
        this.text = program;
        this.position = new Position(-1, 0, -1, fileName);
        this.advance();
    }

    private advance () {
        this.position.advance(this.currentChar);
        this.currentChar = this.text[this.position.idx];
    }

    public generate (): Token[] | Error {

        if (!this.text) {
            return [new Token(this.position, tt.EOF, undefined)];
        }

        const tokens: Token<any>[] = [];

        while (this.currentChar !== undefined) {
            // add semi-colon after
            if (' \t\n'.includes(this.currentChar)) {
                this.advance();

            } else if (digits.includes(this.currentChar)) {
                tokens.push(this.makeNumber());

            } else if (
                this.currentChar === singleLineComment[0] &&
                this.text[this.position.idx + 1] === singleLineComment[1]
            ) {
                this.singleLineComment();
            } else if (
                this.currentChar === multiLineCommentStart[0] &&
                this.text[this.position.idx + 1] === multiLineCommentStart[1]
            ) {
                this.multiLineComment();

            } else if (identifierChars.includes(this.currentChar)) {
                tokens.push(this.makeIdentifier());

            } else if (stringSurrounds.indexOf(this.currentChar) !== -1) {
                tokens.push(this.makeString());

            } else {
                const possibleAssignFirstChar = this.currentChar;
                let token = this.unknownChar();
                if (token) {
                    if (token.type === tt.ASSIGN) {
                        token.value = possibleAssignFirstChar;
                    }
                    tokens.push(token);

                } else {
                    // unknown char
                    let pos = this.position.clone;
                    let char = this.currentChar;
                    this.advance();
                    const err = new IllegalCharError(char);
                    err.pos = pos;
                    return err;
                }
            }
        }

        tokens.push(new Token(this.position, tt.EOF, undefined));

        return tokens;
    }

    private makeNumber () {
        const pos = this.position.clone;
        let numStr = '';
        let dotCount = 0;

        while (this.currentChar !== undefined && isDigit(this.currentChar)) {
            if (this.currentChar === '.') {
                if (dotCount === 1 || !digits.includes(this.text[this.position.idx+1])) {
                    break;
                }

                dotCount++;
                numStr += '.';

                // use _ as a deliminator for sets of 0s - eg 1_000_000_000
                // so just ignore it and move on, but if it is a digit then add it.
            } else if (this.currentChar !== '_') {
                numStr += this.currentChar;
            }
            this.advance();
        }

        return new Token (pos, tt.NUMBER, parseFloat(numStr));
    }

    private makeString () {
        const pos = this.position.clone;
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

        return new Token (pos, tt.STRING, str);
    }

    private makeIdentifier () {
        let idStr = '';
        const posStart = this.position.clone;

        while (this.currentChar !== undefined && (identifierChars + digits).includes(this.currentChar)) {
            idStr += this.currentChar;
            this.advance();
        }

        let tokType = tt.IDENTIFIER;

        if (KEYWORDS.indexOf(idStr) !== -1) {
            tokType = tt.KEYWORD;
        }

        return new Token(posStart, tokType, idStr);
    }

    private unknownChar (): Token<any> | undefined {
        if (this.currentChar === undefined) {
            return undefined;
        }

        for (let triple in tripleCharTokens) {
            if (triple[0] === this.currentChar)
                if (triple[1] === this.text[this.position.idx + 1])
                    if (triple[2] === this.text[this.position.idx + 2]) {
                        const pos = this.position.clone;
                        this.advance();
                        this.advance();
                        this.advance();

                        return new Token(pos, tripleCharTokens[triple], undefined);
                    }
        }

        for (let double in doubleCharTokens) {
            if (double[0] === this.currentChar)
                if (double[1] === this.text[this.position.idx + 1]) {
                        const pos = this.position.clone;
                        this.advance();
                        this.advance();

                        return new Token(pos, doubleCharTokens[double], undefined);
                    }
        }

        if (singleCharTokens.hasOwnProperty(this.currentChar)) {
            let pos = this.position.clone;
            let val = singleCharTokens[this.currentChar];
            this.advance();
            return new Token(pos, val, undefined);
        }

        return undefined;
    }

    private singleLineComment () {
        this.advance();

        while (this.currentChar !== '\n' && this.currentChar !== undefined) {
            this.advance();
        }

        this.advance();
    }

    private multiLineComment () {
        this.advance();

        while (!(
            this.currentChar === multiLineCommentEnd[0] &&
            this.text[this.position.idx + 1] === multiLineCommentEnd[1]
        )) {
            this.advance();
        }

        this.advance();
        this.advance();
    }
}