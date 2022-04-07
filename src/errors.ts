import {IS_NODE_INSTANCE} from './util/constants';
import Position from "./position";
import type {Primitive} from './runtime/primitive';
import {str} from "./util/util";
import chalk from "./util/colours";

export interface TracebackFrame {
    position: Position;
    line: string;
}

export class Error {
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

export class IllegalCharError extends Error {
    constructor(char='<unknown>') {
        super(Position.void, 'IllegalCharError', `'${char}'`);
    }
}

export class InvalidSyntaxError extends Error {
    constructor(details='') {
        super(Position.void,  'InvalidSyntaxError', details);
    }
}

export class TypeError extends Error {
    constructor(expectedType: string, actualType: string, value: any = '', detail = '') {
        super(
            Position.void,
            'TypeError',
            `Expected type '${expectedType}', got type '${actualType}' ${
                typeof value === 'undefined'? '' : ` on value '${str(value)}'`
            } ${!detail ? '' : detail}`
        );
    }
}

export class ImportError extends Error {
    constructor(url: string, detail = '') {
        super(Position.void, 'ImportError',
            `Could not import ${url}: ${detail}`);
    }
}

export class ReferenceError extends Error {
    constructor(ref: string) {
        super(Position.void,'ReferenceError',
            `${ref} is not defined`);
    }
}

export class IndexError extends Error {
    constructor(ref: string, object: Primitive) {
        super(Position.void,'IndexError',
            `'${ref}' is not a property of '${(object?.__info__?.name) || str(object)}'`);
    }
}

export class InvalidOperationError extends Error {
    constructor(op: string, value: Primitive, detail: string = '', pos = Position.void) {
        super(Position.void,'TypeError',
            `Cannot perform '${op}' on value ${value?.__info__?.name || str(value)}: ${detail}`);
    }
}

export class InvalidRuntimeError extends Error {
    constructor () {
        super(Position.void,'InvalidRuntimeError',
            `Required runtime of ${IS_NODE_INSTANCE ? 'browser' : 'node'}`);
    }
}

export class TestFailed extends Error {
    constructor(detail: string) {
        super(Position.void, 'TestFailed', detail);
    }
}

export class PermissionRequiredError extends Error {
    constructor(detail: string) {
        super(Position.void, 'PermissionRequiredError', detail);
    }
}

export class MissingNativeDependencyError extends Error {
    constructor(name: string) {
        super(Position.void, 'MissingNativeDependencyError',
            `Missing required native dependency '${name}'. This is probably an issue with the EntropyScript provider, not your code.`);
    }
}

export class EndIterator extends Error {
    constructor () {
        super(Position.void, 'EndIterator', ``);
    }
}