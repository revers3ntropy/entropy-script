import Position from "../position";
import type {TokenType} from '../util/constants';
import { NativeObj } from "../util/util";

export class Token <T = unknown> {
    type: TokenType;
    value: T;
    pos: Position;

    constructor (pos: Position, type: TokenType, value: T) {
        this.type = type;
        this.value = value;
        this.pos = pos;
    }

    public matches(type: TokenType, val: NativeObj) {
        return this.type === type && this.value === val;
    }
}