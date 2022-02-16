import { IndexError, InvalidOperationError } from '../../errors.js';
import { Position } from '../../position.js';
import { ESBoolean } from './esboolean.js';
import { types } from './primitive.js';
import { str } from '../../util/util.js';
import { wrap } from './wrapStrip.js';
export class ESPrimitive {
    /**
     * @param value
     * @param {ESType|false} type can ONLY be false for initialising the '__type__' ESType
     * @protected
     */
    constructor(value, type = types.any) {
        this.self = this;
        this.__getProperty__ = ({}, key) => {
            if (this.self.hasOwnProperty(key.valueOf())) {
                return wrap(this.self[key.valueOf()]);
            }
            return new IndexError(Position.unknown, key.valueOf(), this);
        };
        this.is = ({ context }, obj) => new ESBoolean(obj === this);
        // getters for private props
        this.valueOf = () => this.__value__;
        this.typeName = () => this.__type__.__name__;
        // Object stuff
        this.hasProperty = ({}, key) => this.hasOwnProperty(key.valueOf());
        // @ts-ignore
        this.__type__ = type || this;
        this.__value__ = value;
        this.info = {};
    }
    // Arithmetic
    __add__(props, n) {
        return new InvalidOperationError('', this);
    }
    __subtract__(props, n) {
        return new InvalidOperationError('', this);
    }
    __multiply__(props, n) {
        return new InvalidOperationError('', this);
    }
    __divide__(props, n) {
        return new InvalidOperationError('', this);
    }
    __pow__(props, n) {
        return new InvalidOperationError('__pow__', this);
    }
    // Boolean Logic
    __eq__(props, n) {
        return new InvalidOperationError('__eq__', this);
    }
    __gt__(props, n) {
        return new InvalidOperationError('__gt__', this);
    }
    __lt__(props, n) {
        return new InvalidOperationError('__lt__', this);
    }
    __and__(props, n) {
        return new InvalidOperationError('__and__', this);
    }
    __or__(props, n) {
        return new InvalidOperationError('__or__', this);
    }
    __bool__(props) {
        return new InvalidOperationError('__bool__', this);
    }
    // Properties
    __setProperty__(props, key, value) {
        return new InvalidOperationError('__setProperty__', this, `[${str(key)}] = ${str(value)}`);
    }
    __call__(props, ...parameters) {
        return new InvalidOperationError('__call__', this);
    }
}
