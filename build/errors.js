import { Position } from "./position.js";
import { str } from "./util/util.js";
export class ESError {
    constructor(pos, name, details) {
        this.traceback = [];
        this.pos = pos;
        this.name = name;
        this.details = details;
    }
    get str() {
        let out = '';
        if (this.traceback.length) {
            out = 'Error Traceback (most recent call last):\n'.yellow;
            for (let pos of [...this.traceback].reverse())
                out += `    ${pos.position.str.cyan}:\n        ${pos.line}\n`;
        }
        out += `${this.name.red}: ${this.details} \n at ${this.pos.str.cyan}`;
        return out;
    }
    get uncolouredStr() {
        return `${this.name}: ${this.details} \n at ${this.pos.str}`;
    }
}
export class IllegalCharError extends ESError {
    constructor(pos, char) {
        super(pos, 'IllegalCharError', `'${char}'`);
    }
}
export class InvalidSyntaxError extends ESError {
    constructor(pos, details) {
        super(pos, 'InvalidSyntaxError', details);
    }
}
export class ExpectedCharError extends ESError {
    constructor(pos, char) {
        super(pos, 'ExpectedCharError', `'${char}'`);
    }
}
export class TypeError extends ESError {
    constructor(pos, expectedType, actualType, value = '', detail = '') {
        super(pos, 'TypeError', `Expected type '${expectedType}', got type '${actualType}' ${typeof value === 'undefined' ? '' : ` on value '${str(value)}'`} ${!detail ? '' : detail}`);
    }
}
export class ImportError extends ESError {
    constructor(pos, url, detail = '') {
        super(pos, 'ImportError', `Could not import ${url}: ${detail}`);
    }
}
export class ReferenceError extends ESError {
    constructor(pos, ref) {
        super(pos, 'ReferenceError', `${ref} is not defined`);
    }
}
export class IndexError extends ESError {
    constructor(pos, ref, object) {
        var _a;
        super(pos, 'IndexError', `'${ref}' is not a property of '${((_a = object === null || object === void 0 ? void 0 : object.info) === null || _a === void 0 ? void 0 : _a.name) || str(object)}'`);
    }
}
export class InvalidOperationError extends ESError {
    constructor(op, value, detail = '', pos = Position.unknown) {
        var _a;
        super(pos, 'TypeError', `Cannot perform '${op}' on value ${((_a = value === null || value === void 0 ? void 0 : value.info) === null || _a === void 0 ? void 0 : _a.name) || str(value)}: ${detail}`);
    }
}
export class TestFailed extends ESError {
    constructor(detail) {
        super(Position.unknown, 'TestFailed', detail);
    }
}
