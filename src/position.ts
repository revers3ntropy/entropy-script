export default class Position {
    file: string;
    idx: number;
    ln: number;
    col: number;

    constructor (idx: number, ln: number, col: number, file: string='(unknown)') {
        this.idx = idx;
        this.ln = ln;
        this.col = col;
        this.file = file;
    }

    advance (currentChar= '') {
        this.idx++;
        this.col++;

        if (currentChar === '\n') {
            this.ln++;
            this.col = 0;
        }

        return this;
    }

    get clone () {
        return new Position(this.idx, this.ln, this.col, this.file);
    }

    get str () {
        return `File ${this.file}, ${this.ln+1}:${this.col+1}`;
    }

    get isUnknown() {
        return this.idx === -2;
    }

    static get void () {
        return new Position(-2, -2, -2, '(unknown)');
    }
}