import {ESError, InvalidOperationError, TypeError} from '../../errors';
import {Position} from '../../position';

import {ESBoolean} from './esboolean';
import type {ESString} from './esstring';
import type {ESType} from './estype';
import type {Info} from './info';
import {NativeObj, Primitive, types} from './primitive';

import { funcProps, str } from '../../util/util';
import {strip} from './wrapStrip';


export abstract class ESPrimitive <T> {
    public __value__: T;
    public __type__: ESType;
    public info: Info;
    protected self: NativeObj = this;

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
     * @type {(config: funcProps, type: Primitive) => Primitive}
     */
    public abstract cast: (config: funcProps, type: Primitive) => Primitive | ESError;

    // Arithmetic
    public __add__ (props: funcProps, n: Primitive): Primitive | ESError {
        return new InvalidOperationError('', this);
    }
    public __subtract__ (props: funcProps, n: Primitive): Primitive | ESError {
        return new InvalidOperationError('', this);
    }
    public __multiply__ (props: funcProps, n: Primitive): Primitive | ESError {
        return new InvalidOperationError('', this);
    }
    public __divide__ (props: funcProps, n: Primitive): Primitive | ESError {
        return new InvalidOperationError('', this);
    }
    public __pow__ (props: funcProps, n: Primitive): Primitive | ESError {
        return new InvalidOperationError('__pow__', this);
    }
    public __mod__ (props: funcProps, n: Primitive): Primitive | ESError {
        return new InvalidOperationError('__mod__', this);
    }

    // Boolean Logic
    public __eq__ (props: funcProps, n: Primitive): ESBoolean | ESError {
        return new InvalidOperationError('__eq__', this);
    }
    public __gt__ (props: funcProps, n: Primitive): ESBoolean | ESError {
        return new InvalidOperationError('__gt__', this);
    }
    public __lt__ (props: funcProps, n: Primitive): ESBoolean | ESError {
        return new InvalidOperationError('__lt__', this);
    }
    public __and__ (props: funcProps, n: Primitive): ESBoolean | ESError {
        return new InvalidOperationError('__and__', this);
    }
    public __or__ (props: funcProps, n: Primitive): ESBoolean | ESError {
        return new InvalidOperationError('__or__', this);
    }
    public __bool__ (props: funcProps): ESBoolean | ESError {
        return new InvalidOperationError('__bool__', this);
    }

    // Properties
    public __setProperty__ (props: funcProps, key: Primitive, value: Primitive): void | ESError {
        return new InvalidOperationError('__setProperty__', this, `[${str(key)}] = ${str(value)}`);
    }
    public abstract __getProperty__: (props: funcProps, key: Primitive) => Primitive | ESError;

    public __call__ (props: funcProps, ...parameters: Primitive[]): ESError | Primitive {
        return new InvalidOperationError('__call__', this);
    }

    public abstract bool(): ESBoolean;

    /**
     * Shallow clone of Primitive
     * @returns {Primitive} deep clone of this
     */
    public abstract clone: () => Primitive;

    /**
     * @returns if this type is a subset of the type passed
     */
    public isa = (props: funcProps, type: Primitive): ESBoolean | ESError => {
        return new ESBoolean(type === this.__type__);
    };

    public is = (props: funcProps, obj: Primitive): ESBoolean => {
        return new ESBoolean(obj === this);
    }

    // getters for private props
    public valueOf = (): T => this.__value__;
    public typeName = (): string => this.__type__.__name__;

    // Object stuff
    public hasProperty = (props: funcProps, key: Primitive): ESBoolean =>
        new ESBoolean(this.hasOwnProperty(str(key)));

    public describe = (props: funcProps, info: Primitive) => {
        if (this.info.isBuiltIn) {
            return;
        }

        this.info.description = str(info);
    };

    public detail = (props: funcProps, info: Primitive) => {

        if (this.info.isBuiltIn) {
            return;
        }

        const res = strip(info, props);

        if (typeof res !== 'object') {
            return new TypeError(Position.unknown, 'object', this.typeName(), str(this));
        }

        this.info = {
            ...this.info,
            ...res
        };

        this.info.isBuiltIn = false;
    };
}
