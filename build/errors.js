import { Position } from "./position.js";
import { str } from "./util.js";
export class ESError {
    constructor(startPos, endPos, name, details) {
        this.startPos = startPos;
        this.endPos = endPos;
        this.name = name;
        this.details = details;
    }
    get str() {
        return `${this.name}: ${this.details} \n at ${this.startPos.str}`;
    }
}
export class IllegalCharError extends ESError {
    constructor(startPos, endPos, char) {
        super(startPos, endPos, 'IllegalCharError', `'${char}'`);
    }
}
export class InvalidSyntaxError extends ESError {
    constructor(startPos, endPos, details) {
        super(startPos, endPos, 'InvalidSyntaxError', details);
    }
}
export class ExpectedCharError extends ESError {
    constructor(startPos, endPos, char) {
        super(startPos, endPos, 'ExpectedCharError', `'${char}'`);
    }
}
export class TypeError extends ESError {
    constructor(startPos, endPos, expectedType, actualType, value = '', detail = '') {
        super(startPos, endPos, 'TypeError', `Expected type '${expectedType}', got type '${actualType}' ${typeof value === 'undefined' ? '' : ` on value ${str(value)}`} ${!detail ? '' : detail}`);
    }
}
export class ImportError extends ESError {
    constructor(startPos, endPos, url, detail = '') {
        super(startPos, endPos, 'ImportError', `Could not import ${url}: ${detail}`);
    }
}
export class ReferenceError extends ESError {
    constructor(startPos, endPos, ref) {
        super(startPos, endPos, 'ReferenceError', `${ref} is not defined`);
    }
}
export class TestFailed extends ESError {
    constructor(detail) {
        super(Position.unknown, Position.unknown, 'TestFailed', detail);
    }
}
