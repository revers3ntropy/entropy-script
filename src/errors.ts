import {Position} from "./position.js";
import {Primitive} from './runtime/primitives/primitive.js';
import {str} from "./util/util.js";

export interface TracebackFrame {
    position: Position;
    line: string;
}

export class ESError {
    name: string;
    details: string;
    startPos: Position;
    traceback: TracebackFrame[] = [];

    constructor (startPos: Position, name: string, details: string) {
        this.startPos = startPos;
        this.name = name;
        this.details = details;
    }

    get str (): string {
        let out = '';
        if (this.traceback.length) {
            out = 'Error Traceback (most recent call last):\n'.yellow;
            for (let pos of [...this.traceback].reverse())
                out += `    ${pos.position.str.cyan}:\n        ${pos.line}\n`;
        }

        out += `${this.name.red}: ${this.details} \n at ${this.startPos.str.cyan}`;
        return out;
    }

    get uncolouredStr () {
        return `${this.name}: ${this.details} \n at ${this.startPos.str}`;
    }
}

export class IllegalCharError extends ESError {
    constructor(startPos: Position, char: string) {
        super(startPos, 'IllegalCharError', `'${char}'`);
    }
}

export class InvalidSyntaxError extends ESError {
    constructor(startPos: Position, details: string) {
        super(startPos,  'InvalidSyntaxError', details);
    }
}

export class ExpectedCharError extends ESError {
    constructor(startPos: Position, char: string) {
        super(startPos, 'ExpectedCharError', `'${char}'`);
    }
}

export class TypeError extends ESError {
    constructor(startPos: Position, expectedType: string, actualType: string, value: any = '', detail = '') {
        super(
            startPos,
            'TypeError',
            `Expected type '${expectedType}', got type '${actualType}' ${
                typeof value === 'undefined'? '' : ` on value '${str(value)}'`
            } ${!detail ? '' : detail}`
        );
    }
}

export class ImportError extends ESError {
    constructor(startPos: Position, url: string, detail = '') {
        super(startPos, 'ImportError', `Could not import ${url}: ${detail}`);
    }
}

export class ReferenceError extends ESError {
    constructor(startPos: Position, ref: string) {
        super(startPos,'ReferenceError', `${ref} is not defined`);
    }
}

export class IndexError extends ESError {
    constructor(pos: Position, ref: string, object: Primitive) {
        super(pos,'IndexError', `${ref} is not defined on object '${object.info.name}'`);
    }
}

export class InvalidOperationError extends ESError {
    constructor(op: string, value: Primitive, detail: string = '', pos = Position.unknown) {
        super(pos,'TypeError', `Cannot perform '${op}' on value ${value.info.name || str(value)}: ${detail}`);
    }
}

export class TestFailed extends ESError {
    constructor(detail: string) {
        super(Position.unknown, 'TestFailed', detail);
    }
}