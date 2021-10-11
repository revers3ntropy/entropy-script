import { Position } from "./position.js";
import { str } from "./util.js";
export class ESError {
    constructor(startPos, name, details) {
        this.startPos = startPos;
        this.name = name;
        this.details = details;
    }
    get str() {
        return `${this.name}: ${this.details} \n at ${this.startPos.str}`;
    }
}
export class IllegalCharError extends ESError {
    constructor(startPos, char) {
        super(startPos, 'IllegalCharError', `'${char}'`);
    }
}
export class InvalidSyntaxError extends ESError {
    constructor(startPos, details) {
        super(startPos, 'InvalidSyntaxError', details);
    }
}
export class ExpectedCharError extends ESError {
    constructor(startPos, char) {
        super(startPos, 'ExpectedCharError', `'${char}'`);
    }
}
export class TypeError extends ESError {
    constructor(startPos, expectedType, actualType, value = '', detail = '') {
        super(startPos, 'TypeError', `Expected type '${expectedType}', got type '${actualType}' ${typeof value === 'undefined' ? '' : ` on value '${str(value)}'`} ${!detail ? '' : detail}`);
    }
}
export class ImportError extends ESError {
    constructor(startPos, url, detail = '') {
        super(startPos, 'ImportError', `Could not import ${url}: ${detail}`);
    }
}
export class ReferenceError extends ESError {
    constructor(startPos, ref) {
        super(startPos, 'ReferenceError', `${ref} is not defined`);
    }
}
export class TestFailed extends ESError {
    constructor(detail) {
        super(Position.unknown, 'TestFailed', detail);
    }
}
