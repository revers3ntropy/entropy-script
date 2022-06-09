import Position from "../position";
import type { TokenType } from '../util/constants';
import { NativeObj } from "../util/util";

/**
 * What the Lexer spits out an array of.
 * The Lexer turns a string into an array of these.
 * For example, you might have a string token with a value, or a '<' token.
 */
export default class <T = unknown> {
    public type: TokenType;
    public value: T;
    public pos: Position;

    constructor (pos: Position, type: TokenType, value: T) {
        this.type = type;
        this.value = value;
        this.pos = pos;
    }

    public matches (type: TokenType, val: NativeObj) {
        return this.type === type && this.value === val;
    }
}