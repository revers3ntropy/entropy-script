export class Position {
    constructor(idx, ln, col) {
        this.idx = idx;
        this.ln = ln;
        this.col = col;
    }
    advance(currentChar = '') {
        this.idx++;
        this.col++;
        if (currentChar === '\n') {
            this.ln++;
            this.col = 0;
        }
        return this;
    }
    get clone() {
        return new Position(this.idx, this.ln, this.col);
    }
    get str() {
        return `${this.ln + 1}:${this.col + 1}`;
    }
    static get unknown() {
        return new Position(-2, -2, -2);
    }
}
