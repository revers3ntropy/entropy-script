import type Position from "../position";
import type {TokenType} from '../util/constants';
import type { NativeObj } from "../util/util";
import { tt, ttAsStr } from "../util/constants";

const rawTokens: TokenType[] = [tt.STRING, tt.NUMBER, tt.IDENTIFIER];

export class Token <T extends ({toString: any} | undefined) = any> {
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

    public str (): string {
        if (rawTokens.includes(this.type)) {
            return this.value?.toString() || '';
        }
        return ttAsStr[this.type];
    }
}