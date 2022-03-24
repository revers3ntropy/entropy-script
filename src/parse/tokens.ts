import Position from "../position";
import type {tokenType} from '../constants';
import type {NativeObj} from '../runtime/primitives/primitive';

export class Token <T = undefined> {
    type: tokenType;
    value: T;
    pos: Position;

    constructor (pos: Position, type: tokenType, value: T) {
        this.type = type;
        this.value = value;
        this.pos = pos;
    }

    public matches(type: tokenType, val: NativeObj) {
        return this.type === type && this.value === val;
    }
}