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
    pos = Position.void;

    traceback: TracebackFrame[] = [];

    constructor (name: string, details: string) {
        this.name = name;
        this.details = details;
    }

    get colouredStr (): string {
        let out = '';
        if (this.traceback.length) {
            out = chalk.yellow('Error Traceback (most recent call last):\n');
            for (const pos of [...this.traceback].reverse())
                out += `    ${chalk.cyan(pos.position.str)}:\n        ${pos.line}\n`;
        }

        out += `${chalk.red(this.name)}: ${this.details} \n at ${chalk.cyan(this.pos.str)}`;
        return out;
    }

    get str () {
        return `${this.name}: ${this.details} \n at ${this.pos.str}`;
    }

    /**
     * For easy adding of positions to errors
     */
    position (pos: Position) {
        this.pos = pos;
        return this;
    }
}

export class IllegalCharError extends Error {
    constructor(char='<unknown>') {
        super('IllegalCharError', `'${char}'`);
    }
}

export class InvalidSyntaxError extends Error {
    constructor(details='') {
        super('InvalidSyntaxError', details);
    }
}

export class TypeError extends Error {
    constructor(expectedType: string, actualType: string, value: any = '', detail = '') {
        super(
            'TypeError',
            `Expected type '${expectedType}', got type '${actualType}' ${
                typeof value === 'undefined'? '' : ` on value '${str(value)}'`
            } ${!detail ? '' : detail}`
        );
    }
}

export class ImportError extends Error {
    constructor(url: string, detail = '') {
        super('ImportError',
            `Could not import ${url}: ${detail}`);
    }
}

export class ReferenceError extends Error {
    constructor(ref: string) {
        super('ReferenceError',
            `${ref} is not defined`);
    }
}

export class IndexError extends Error {
    constructor(ref: string, object: Primitive) {
        super('IndexError',
            `'${ref}' is not a property of '${(object?.__info__?.name) || str(object)}'`);
    }
}

export class InvalidOperationError extends Error {
    constructor(op: string, value: Primitive, detail = '', pos = Position.void) {
        super('TypeError',
            `Cannot perform '${op}' on value ${value?.__info__?.name || str(value)}: ${detail}`);
        this.pos = pos;
    }
}

export class InvalidRuntimeError extends Error {
    constructor () {
        super('InvalidRuntimeError',
            `Required runtime of ${IS_NODE_INSTANCE ? 'browser' : 'node'}`);
    }
}

export class TestFailed extends Error {
    constructor(detail: string) {
        super( 'TestFailed', detail);
    }
}

export class PermissionRequiredError extends Error {
    constructor(detail: string) {
        super('PermissionRequiredError', detail);
    }
}

export class MissingNativeDependencyError extends Error {
    constructor(name: string) {
        super('MissingNativeDependencyError',
            `Missing required native dependency '${name}'. This is probably an issue with the EntropyScript provider, not your code.`);
    }
}

export class EndIterator extends Error {
    constructor () {
        super('EndIterator', ``);
    }
}