/**
 * Position within a file.
 * Stores column and row, filename, and index in file.
 * Index used by lexer, rest used by error messages.
 */
export default class Position {
    file: string;
    idx: number;
    ln: number;
    col: number;

    constructor (idx: number, ln: number, col: number, file='(unknown)') {
        this.idx = idx;
        this.ln = ln;
        this.col = col;
        this.file = file;
    }

    /**
     * Used by lexer to advance the current position one step.
     */
    advance (currentChar='') {
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
        if (this.isUnknown) {
            return 'unknown';
        }
        return `File ${this.file}, ${this.ln+1}:${this.col+1}`;
    }

    /**
     * Checks if the index is equal to the position of Position.void
     * @returns {boolean}
     */
    get isUnknown() {
        return this.idx === -2;
    }

    /**
     * Gets a void position for where a position is required, but not known.
     */
    static get void () {
        return new Position(-2, -2, -2, '(unknown)');
    }
}