import {IS_NODE_INSTANCE} from './util/constants';
import Position from "./position";
import {Primitive} from './runtime/primitives/primitive';
import {str} from "./util/util";
import chalk from "./util/colours";

export interface TracebackFrame {
    position: Position;
    line: string;
}

export class ESError {
    name: string;
    details: string;
    pos: Position;

    traceback: TracebackFrame[] = [];

    constructor (pos: Position, name: string, details: string) {
        this.pos = pos;
        this.name = name;
        this.details = details;
    }

    get colouredStr (): string {
        let out = '';
        if (this.traceback.length) {
            out = chalk.yellow('Error Traceback (most recent call last):\n');
            for (let pos of [...this.traceback].reverse())
                out += `    ${chalk.cyan(pos.position.str)}:\n        ${pos.line}\n`;
        }

        out += `${chalk.red(this.name)}: ${this.details} \n at ${chalk.cyan(this.pos.str)}`;
        return out;
    }

    get str () {
        return `${this.name}: ${this.details} \n at ${this.pos.str}`;
    }
}

export class IllegalCharError extends ESError {
    constructor(pos: Position, char: string) {
        super(pos, 'IllegalCharError', `'${char}'`);
    }
}

export class InvalidSyntaxError extends ESError {
    constructor(pos: Position, details: string) {
        super(pos,  'InvalidSyntaxError', details);
    }
}

export class ExpectedCharError extends ESError {
    constructor(pos: Position, char: string) {
        super(pos, 'ExpectedCharError', `'${char}'`);
    }
}

export class TypeError extends ESError {
    constructor(pos: Position, expectedType: string, actualType: string, value: any = '', detail = '') {
        super(
            pos,
            'TypeError',
            `Expected type '${expectedType}', got type '${actualType}' ${
                typeof value === 'undefined'? '' : ` on value '${str(value)}'`
            } ${!detail ? '' : detail}`
        );
    }
}

export class ImportError extends ESError {
    constructor(pos: Position, url: string, detail = '') {
        super(pos, 'ImportError', `Could not import ${url}: ${detail}`);
    }
}

export class ReferenceError extends ESError {
    constructor(pos: Position, ref: string) {
        super(pos,'ReferenceError', `${ref} is not defined`);
    }
}

export class IndexError extends ESError {
    constructor(pos: Position, ref: string, object: Primitive) {
        super(pos,'IndexError', `'${ref}' is not a property of '${(object?.__info__?.name) || str(object)}'`);
    }
}

export class InvalidOperationError extends ESError {
    constructor(op: string, value: Primitive, detail: string = '', pos = Position.void) {
        super(pos,'TypeError', `Cannot perform '${op}' on value ${value?.__info__?.name || str(value)}: ${detail}`);
    }
}

export class InvalidRuntimeError extends ESError {
    constructor () {
        super(Position.void,'InvalidRuntimeError', `Required runtime of ${IS_NODE_INSTANCE ? 'browser' : 'node'}`);
    }
}

export class TestFailed extends ESError {
    constructor(detail: string) {
        super(Position.void, 'TestFailed', detail);
    }
}

export class PermissionRequiredError extends ESError {
    constructor(detail: string) {
        super(Position.void, 'PermissionRequiredError', detail);
    }
}

export class MissingNativeDependencyError extends ESError {
    constructor(name: string) {
        super(Position.void, 'MissingNativeDependencyError',
            `Missing required native dependency '${name}'. This is probably an issue with the EntropyScript provider, not your code.`);
    }
}