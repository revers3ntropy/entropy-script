export class Token {
    constructor(pos, type, value = undefined) {
        this.type = type;
        this.value = value;
        this.pos = pos;
    }
    matches(type, val) {
        return this.type === type && this.value === val;
    }
}
