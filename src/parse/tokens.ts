import {Position} from "../position.js";
import {tokenType} from '../constants.js';

export class Token {
    type: tokenType;
    value: any;
    pos: Position;

    constructor (pos: Position, type: tokenType, value: NativeObj = undefined) {
        this.type = type;
        this.value = value;
        this.pos = pos;
    }

    public matches(type: tokenType, val: NativeObj) {
        return this.type === type && this.value === val;
    }
}