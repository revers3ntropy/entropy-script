import {ESError, IndexError, InvalidOperationError} from '../../errors.js';
import {Position} from '../../position.js';
import {Context} from '../context.js';

import type {ESBoolean} from './esboolean.js';
import type {ESString} from './esstring.js';
import type {ESType} from './estype.js';
import {ESUndefined} from './esundefined.js';
import type {Info} from './info.js';
import {Primitive, types} from './primitive.js';

import {str} from '../../util/util.js';
import {wrap} from './wrapStrip.js';


export abstract class ESPrimitive <T> {
    public __value__: T;
    public __type__: ESType;
    public info: Info;
    protected self: any = this;

    /**
     * @param value
     * @param {ESType|false} type can ONLY be false for initialising the '__type__' ESType
     * @protected
     */
    protected constructor (value: T, type: ESType | false = types.any) {
        // @ts-ignore
        this.__type__ = type || this;
        this.__value__ = value;
        this.info = {};
    }

    // casting
    /**
     * Cast to string
     * @returns {ESString} this cast to string
     */
    public abstract str: () => ESString;
    /**
     * Casts to any type
     * @type {(config: {context: Context}, type: Primitive) => Primitive}
     */
    public abstract cast: (config: {context: Context}, type: Primitive) => Primitive | ESError;

    // Arithmetic
    public __add__ (props: {context: Context}, n: Primitive): Primitive | ESError {
        return new InvalidOperationError('', this);
    }
    public __subtract__ (props: {context: Context}, n: Primitive): Primitive | ESError {
        return new InvalidOperationError('', this);
    }
    public __multiply__ (props: {context: Context}, n: Primitive): Primitive | ESError {
        return new InvalidOperationError('', this);
    }
    public __divide__ (props: {context: Context}, n: Primitive): Primitive | ESError {
        return new InvalidOperationError('', this);
    }
    public __pow__ (props: {context: Context}, n: Primitive): Primitive | ESError {
        return new InvalidOperationError('__pow__', this);
    }

    // Boolean Logic
    public __eq__ (props: {context: Context}, n: Primitive): ESBoolean | ESError {
        return new InvalidOperationError('__eq__', this);
    }
    public __gt__ (props: {context: Context}, n: Primitive): ESBoolean | ESError {
        return new InvalidOperationError('__gt__', this);
    }
    public __lt__ (props: {context: Context}, n: Primitive): ESBoolean | ESError {
        return new InvalidOperationError('__lt__', this);
    }
    public __and__ (props: {context: Context}, n: Primitive): ESBoolean | ESError {
        return new InvalidOperationError('__and__', this);
    }
    public __or__ (props: {context: Context}, n: Primitive): ESBoolean | ESError {
        return new InvalidOperationError('__or__', this);
    }
    public __bool__ (props: {context: Context}): ESBoolean | ESError {
        return new InvalidOperationError('__bool__', this);
    }

    // Properties
    public __setProperty__ (props: {context: Context}, key: Primitive, value: Primitive): void | ESError {
        return new InvalidOperationError('__setProperty__', this, `[${str(key)}] = ${str(value)}`);
    }
    public __getProperty__ = ({}: {context: Context}, key: Primitive): Primitive | ESError => {
        if (this.self.hasOwnProperty(key.valueOf())) {
            return wrap(this.self[key.valueOf()]);
        }
        return new IndexError(Position.unknown, key.valueOf(), this);
    };

    public __call__ (props: {context: Context}, ...parameters: Primitive[]): ESError | Primitive {
        return new InvalidOperationError('__call__', this);
    }

    public abstract bool(): ESBoolean;

    /**
     * @param {Primitive[]} chain for solving circular objects. First element is object originally cloned
     * @returns {Primitive} deep clone of this
     */
    public abstract clone: (chain: Primitive[]) => Primitive;

    /**
     * @returns if this type is a subset of the type passed
     */
    public abstract isa: (config: {context: Context}, type: Primitive) => ESBoolean | ESError;

    // getters for private props
    public valueOf = (): T => this.__value__;
    public typeName = (): string => this.__type__.__name__;

    // Object stuff
    public hasProperty = ({}: {context: Context}, key: ESString): boolean =>
        this.hasOwnProperty(key.valueOf());
}