import Position from "../position";
import {
    DIGITS, DOUBLE_TOKENS,
    IDENTIFIER_CHARS,
    KEYWORDS, MULTI_LINE_COMMENT_END, MULTI_LINE_COMMENT_START, SINGLE_TOKENS,
    ONE_LINE_COMMENT,
    STRING_SURROUNDS, TRIPLE_TOKENS, tt, WHITESPACE,
} from '../util/constants';
import {Error, IllegalCharError} from "../errors";
import {Token} from "./tokens";

function isDigit (n: string) {
    return (DIGITS+'._').includes(n);
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
            if (WHITESPACE.includes(this.currentChar)) {
                this.advance();

            } else if (DIGITS.includes(this.currentChar)) {
                tokens.push(this.makeESNumber());

            } else if (
                this.currentChar === ONE_LINE_COMMENT[0] &&
                this.text[this.position.idx + 1] === ONE_LINE_COMMENT[1]
            ) {
                this.singleLineComment();
            } else if (
                this.currentChar === MULTI_LINE_COMMENT_START[0] &&
                this.text[this.position.idx + 1] === MULTI_LINE_COMMENT_START[1]
            ) {
                this.multiLineComment();

            } else if (IDENTIFIER_CHARS.includes(this.currentChar)) {
                tokens.push(this.makeIdentifier());

            } else if (STRING_SURROUNDS.indexOf(this.currentChar) !== -1) {
                tokens.push(this.makeString());

            } else {
                const possibleAssignFirstChar = this.currentChar;
                const token = this.unknownChar();
                if (token) {
                    if (token.type === tt.ASSIGN) {
                        token.value = possibleAssignFirstChar;
                    }
                    tokens.push(token);

                } else {
                    // unknown char
                    const pos = this.position.clone;
                    const char = this.currentChar;
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

    private makeESNumber () {
        const pos = this.position.clone;
        let numStr = '';
        let dotCount = 0;

        while (this.currentChar !== undefined && isDigit(this.currentChar)) {
            if (this.currentChar === '.') {
                if (dotCount === 1 || !DIGITS.includes(this.text[this.position.idx+1])) {
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
        const strClose = this.currentChar;
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

        while (this.currentChar !== undefined && (IDENTIFIER_CHARS + DIGITS).includes(this.currentChar)) {
            idStr += this.currentChar;
            this.advance();
        }

        let tokType = tt.IDENTIFIER;

        return new Token(posStart, tokType, idStr);
    }

    private unknownChar (): Token<any> | undefined {
        if (this.currentChar === undefined) {
            return undefined;
        }

        for (const triple in TRIPLE_TOKENS) {
            if (triple[0] === this.currentChar)
                if (triple[1] === this.text[this.position.idx + 1])
                    if (triple[2] === this.text[this.position.idx + 2]) {
                        const pos = this.position.clone;
                        this.advance();
                        this.advance();
                        this.advance();

                        return new Token(pos, TRIPLE_TOKENS[triple], undefined);
                    }
        }

        for (const double in DOUBLE_TOKENS) {
            if (double[0] === this.currentChar)
                if (double[1] === this.text[this.position.idx + 1]) {
                        const pos = this.position.clone;
                        this.advance();
                        this.advance();

                        return new Token(pos, DOUBLE_TOKENS[double], undefined);
                    }
        }

        if (this.currentChar in SINGLE_TOKENS) {
            const pos = this.position.clone;
            const val = SINGLE_TOKENS[this.currentChar];
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
            this.currentChar === MULTI_LINE_COMMENT_END[0] &&
            this.text[this.position.idx + 1] === MULTI_LINE_COMMENT_END[1]
        )) {
            this.advance();
        }

        this.advance();
        this.advance();
    }
}