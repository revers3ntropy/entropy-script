import type {ESType} from './estype';
import {Error, InvalidOperationError, TypeError} from '../../errors';

import Position from '../../position';
import {ESBoolean} from './esboolean';
import type {ESString} from './esstring';
import type {Info} from './info';
import type { NativeObj, Primitive} from './primitive';
import { funcProps, str } from '../../util/util';
import { strip } from './wrapStrip';
import { types } from "../../util/constants";
import type { ESNumber } from "./esnumber";


export abstract class ESPrimitive <T> {
    public __value__: T;
    public __type__: Primitive;
    public __info__: Info;
    public __iterable__ = false;
    protected _: NativeObj = this;

    /**
     * @param value
     * @param {ESType|false} type can ONLY be false for initialising the '__type__' ESType
     * @protected
     */
    protected constructor (value: T, type: Primitive | false = types.any) {
        this.__type__ = type || this;
        this.__value__ = value;
        this.__info__ = {};
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
    public abstract cast: (config: funcProps, type: Primitive) => Primitive | Error;

    // Arithmetic
    public __add__ (props: funcProps, n: Primitive): Primitive | Error {
        return new InvalidOperationError('', this);
    }
    public __subtract__ (props: funcProps, n: Primitive): Primitive | Error {
        return new InvalidOperationError('', this);
    }
    public __multiply__ (props: funcProps, n: Primitive): Primitive | Error {
        return new InvalidOperationError('', this);
    }
    public __divide__ (props: funcProps, n: Primitive): Primitive | Error {
        return new InvalidOperationError('', this);
    }
    public __pow__ (props: funcProps, n: Primitive): Primitive | Error {
        return new InvalidOperationError('__pow__', this);
    }
    public __mod__ (props: funcProps, n: Primitive): Primitive | Error {
        return new InvalidOperationError('__mod__', this);
    }

    // Boolean Logic
    public __eq__ (props: funcProps, n: Primitive): ESBoolean | Error {
        return new InvalidOperationError('__eq__', this);
    }
    public __gt__ (props: funcProps, n: Primitive): ESBoolean | Error {
        return new InvalidOperationError('__gt__', this);
    }
    public __lt__ (props: funcProps, n: Primitive): ESBoolean | Error {
        return new InvalidOperationError('__lt__', this);
    }
    public __and__ (props: funcProps, n: Primitive): ESBoolean | Error {
        return new InvalidOperationError('__and__', this);
    }
    public __or__ (props: funcProps, n: Primitive): ESBoolean | Error {
        return new InvalidOperationError('__or__', this);
    }
    public __bool__ (props: funcProps): ESBoolean | Error {
        return new InvalidOperationError('__bool__', this);
    }

    public __pipe__ (props: funcProps, n: Primitive): Primitive | Error {
        return new InvalidOperationError('__pipe__', this);
    }
    public __ampersand__ (props: funcProps, n: Primitive): Primitive | Error {
        return new InvalidOperationError('__ampersand__', this);
    }
    public __set__ (props: funcProps, key: Primitive, value: Primitive): void | Error {
        return new InvalidOperationError('__set__', this, `[${str(key)}] = ${str(value)}`);
    }
    public abstract __get__: (props: funcProps, key: Primitive) => Primitive | Error;

    public __call__ (props: funcProps, ...parameters: Primitive[]): Error | Primitive {
        return new InvalidOperationError('__call__', this);
    }

    public __iter__(props: funcProps): Error | Primitive {
        return new InvalidOperationError('__iter__', this);
    }

    public __next__(props: funcProps): Error | Primitive {
        return new InvalidOperationError('__next__', this);
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
    public isa = (props: funcProps, type: Primitive): ESBoolean | Error => {
        return type.__includes__(props, this);
    };

    public is = (props: funcProps, obj: Primitive): ESBoolean => {
        return new ESBoolean(obj === this);
    }

    public abstract keys: (props: funcProps) => (ESString | ESNumber)[];

    // getters for private props
    public __type_name__ = (): string => str(this.__type__);

    // Object stuff
    public has_property = (props: funcProps, key: Primitive): ESBoolean => {
        return new ESBoolean(this.hasOwnProperty(str(key)));
    }

    public describe = (props: funcProps, info: Primitive) => {
        if (this.__info__.builtin) {
            return;
        }

        this.__info__.description = str(info);
    };

    public detail = (props: funcProps, info: Primitive) => {

        if (this.__info__.builtin) {
            return;
        }

        const res = strip(info, props);

        if (typeof res !== 'object') {
            return new TypeError(Position.void, 'object', this.__type_name__(), str(this));
        }

        this.__info__ = {
            ...this.__info__,
            ...res
        };

        this.__info__.builtin = false;
    };

    abstract __includes__: (props: funcProps, n: Primitive) => ESBoolean | Error;
}


