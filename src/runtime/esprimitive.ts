import {Error, InvalidOperationError, TypeError} from '../errors';
import {ESBoolean} from './primitives/boolean';
import type {ESString} from './primitives/string';
import type {Info} from './info';
import { IFuncProps, NativeObj, Primitive, str } from '../util/util';
import { strip } from './wrapStrip';
import { types } from "../util/constants";
import type { ESNumber } from "./primitives/number";

export interface ESPrimitive<T> {
    __add__: (props: IFuncProps, n: Primitive) => Primitive | Error;
    __subtract__: (props: IFuncProps, n: Primitive) => Primitive | Error;
    __multiply__: (props: IFuncProps, n: Primitive) => Primitive | Error;
    __divide__: (props: IFuncProps, n: Primitive) => Primitive | Error;
    __pow__: (props: IFuncProps, n: Primitive) => Primitive | Error;
    __mod__: (props: IFuncProps, n: Primitive) => Primitive | Error;
    __eq__: (props: IFuncProps, n: Primitive) => ESBoolean | Error;
    __gt__: (props: IFuncProps, n: Primitive) => ESBoolean | Error;
    __lt__: (props: IFuncProps, n: Primitive) => ESBoolean | Error;
    __and__: (props: IFuncProps, n: Primitive) => ESBoolean | Error;
    __or__: (props: IFuncProps, n: Primitive) => ESBoolean | Error;
    __bool__: (props: IFuncProps) => ESBoolean | Error;
    __pipe__: (props: IFuncProps, n: Primitive) => Primitive | Error;
    __ampersand__: (props: IFuncProps, n: Primitive) => Primitive | Error;
    __set__: (props: IFuncProps, key: Primitive, value: Primitive) => void | Error;
    __call__: (props: IFuncProps, ...parameters: Primitive[]) => Error | Primitive;
    __generic__: (props: IFuncProps, ...parameters: Primitive[]) => Error | Primitive;
    __iter__: (props: IFuncProps) => Error | Primitive;
    __next__: (props: IFuncProps) => Error | Primitive;
    __nullish__: (props: IFuncProps, n: Primitive) => Primitive | Error;
    isa: (props: IFuncProps, type: Primitive) => ESBoolean | Error;
    is: (props: IFuncProps, obj: Primitive) => ESBoolean;
    __type_name__: () => string;
    has_property: (props: IFuncProps, key: Primitive) => ESBoolean;
}

export abstract class ESPrimitive <T> {

    public __value__: T;
    public __type__: Primitive;
    public __info__: Info;
    public __iterable__ = false;
    public __null__ = false;
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

    /**
     * Cast to string
     */
    public abstract str: (props: IFuncProps, depth: ESNumber) => ESString;

    /**
     * Tries to cast to the type passed.
     * If it cannot be cast, a TypeError is thrown.
     */
    public abstract cast: (config: IFuncProps, type: Primitive) => Primitive | Error;

    /**
     * The '+' operator
     */
    public __add__ = (props: IFuncProps, _: Primitive): Primitive | Error => {
        return new InvalidOperationError('+', this);
    }

    /**
     * The '-' operator
     */
    public __subtract__ = (props: IFuncProps, _: Primitive): Primitive | Error => {
        return new InvalidOperationError('-', this);
    }

    /**
     * The '*' operator
     */
    public __multiply__ = (props: IFuncProps, _: Primitive): Primitive | Error => {
        return new InvalidOperationError('*', this);
    }

    /**
     * The '/' operator
     */
    public __divide__ = (props: IFuncProps, _: Primitive): Primitive | Error => {
        return new InvalidOperationError('/', this);
    }

    /**
     * The '^' operator
     */
    public __pow__ = (props: IFuncProps, _: Primitive): Primitive | Error => {
        return new InvalidOperationError('^', this);
    }

    /**
     * The '%' operator
     */
    public __mod__ = (props: IFuncProps, _: Primitive): Primitive | Error => {
        return new InvalidOperationError('%', this);
    }

    /**
     * The '==' operator
     */
    public __eq__ = (props: IFuncProps, _: Primitive): ESBoolean | Error => {
        return new InvalidOperationError('==', this);
    }

    /**
     * The '>' operator
     */
    public __gt__ = (props: IFuncProps, _: Primitive): ESBoolean | Error => {
        return new InvalidOperationError('>', this);
    }

    /**
     * The '<' operator
     */
    public __lt__ = (props: IFuncProps, _: Primitive): ESBoolean | Error => {
        return new InvalidOperationError('<', this);
    }

    /**
     * The '&&' operator
     */
    public __and__ = (props: IFuncProps, _: Primitive): ESBoolean | Error => {
        return new InvalidOperationError('&&', this);
    }

    /**
     * The '||' operator
     */
    public __or__ = (props: IFuncProps, _: Primitive): ESBoolean | Error => {
        return new InvalidOperationError('||', this);
    }

    /**
     * Implicitly called when a boolean value is required.
     * Must return a boolean value.
     */
    public __bool__ = (_: IFuncProps): ESBoolean | Error => {
        return new InvalidOperationError('__bool__', this);
    }

    /**
     * The '|' operator
     */
    public __pipe__ = (props: IFuncProps, _: Primitive): Primitive | Error => {
        return new InvalidOperationError('|', this);
    }

    /**
     * The '&' operator
     */
    public __ampersand__ = (props: IFuncProps, _: Primitive): Primitive | Error => {
        return new InvalidOperationError('&', this);
    }

    /**
     * Called when an object is first 'indexed into' and then directly assigned to,
     * either through 'a.x = c' or 'a[b] = c', where a, b and c are <expr> and x is an identifier.
     */
    public __set__ = (props: IFuncProps, key: Primitive, value: Primitive): void | Error => {
        return new InvalidOperationError('__set__', this, `[${str(key)}] = ${str(value)}`);
    }

    /**
     * Called when the object is 'indexed into', either through 'a.b' or 'a[b]'.
     * Which syntax has been used is not known to this function.
     */
    public abstract __get__: (props: IFuncProps, key: Primitive) => Primitive | Error;

    /**
     * Runs when the object is 'called' with the '( ... )' operator.
     * Takes arguments as arguments, which can be collected into an arrray.
     * Kwargs are passed in 'props'
     */
    public __call__ = (props: IFuncProps, ..._: Primitive[]): Error | Primitive => {
        return new InvalidOperationError('__call__', this);
    }

    /**
     * Called when applying the '<| ... |>' operator to an object.
     * Generally used to make a subtype of a type with specific types attached - generic or template types.
     * In this case, will return a type with populated '__generic_types__' array attached.
     */
    public __generic__ = (props: IFuncProps, ..._: Primitive[]): Error | Primitive => {
        return new InvalidOperationError('__generic__', this);
    }

    /**
     * Part of the Iterator protocol
     * Returns a value with (hopefully) a '__next__' function, which can then be iterated over.
     * Will often return an array.
     */
    public __iter__ = (_: IFuncProps): Error | Primitive => {
        return new InvalidOperationError('__iter__', this);
    }

    /**
     * Part of the Iterator protocol
     * Returns a value which is the next value to be iterated over.
     * Returns an instance of EndIterator Error to end the iteration.
     * Used in for loops.
     */
    public __next__ = (_: IFuncProps): Error | Primitive => {
        return new InvalidOperationError('__next__', this);
    }

    /**
     * The '??' operator.
     * Returns the right-hand value if undefined, and the left hand value if it is defined.
     * Can be used to give a default or fallback value to, for example, the return value of a function
     * to narrow the type from 'something | nil' to 'something'
     */
    public __nilish__ = (props: IFuncProps, n: Primitive): Primitive | Error => {
        // if this is undefined, then return the
        if (this.__null__) {
            return n;
        }
        return this;
    }

    /**
     * Casts to boolean.
     * Only explicitly called.
     * Should return a boolean, but could be overriden to not.
     */
    public abstract bool(): ESBoolean;

    /**
     * Shallow copy
     */
    public abstract clone: () => Primitive;

    /**
     * @returns if this type is a subset of the type passed
     */
    public isa = (props: IFuncProps, type: Primitive): ESBoolean | Error => {
        return type.__includes__(props, this);
    };

    public is = (props: IFuncProps, obj: Primitive): ESBoolean => {
        return new ESBoolean(obj === this);
    }

    /**
     * Gets the keys of the properties on the value,
     * including the keys of the native functions such as 'keys' and '__iter__'
     */
    public abstract keys: (props: IFuncProps) => (ESString | ESNumber)[];

    /**
     * Gets the type name as a string.
     */
    public __type_name__ = (): string => str(this.__type__);

    /**
     * Returns true if the property is accessible on the object.
     * As a default, it will check if the property exists on the native object.
     */
    public has_property = (props: IFuncProps, key: Primitive): ESBoolean => {
        return new ESBoolean(str(key) in this);
    }

    /**
     * Adds a description to the object,
     * which will be accessed through the built-in 'help' function.
     */
    public describe = (props: IFuncProps, info: Primitive) => {
        if (this.__info__.builtin) {
            return;
        }

        this.__info__.description = str(info);
    };

    /**
     * Adds more advanced details to the object, which again will be used by 'help'
     * The info parameter should take the following signature:
     *  IInfo = interface({
     *     name: ?Str,
     *     description: ?Str,
     *     file: ?Str,
     *     helpLink: ?Str,
     *     builtin: ?Bool,
     *     args: ?Arr<|{
     *         name: ?Str,
     *         type: ?Str,
     *         description: ?Str,
     *         required: ?Bool,
     *         default_value: ?Str,
     *     }|>;
     *     returns: ?Str,
     *     returnType: ?Str,
     *     allow_args: ?Bool,
     *     contents: ?Arr<|IInfo|>
     *  })
     */
    public detail = (props: IFuncProps, info: Primitive) => {

        if (this.__info__.builtin) {
            return;
        }

        const res = strip(info, props);

        if (typeof res !== 'object') {
            return new TypeError('object', this.__type_name__(), str(this));
        }

        this.__info__ = {
            ...this.__info__,
            ...res
        };

        this.__info__.builtin = false;
    };

    /**
     * Checks whether, treating the current object as a type, the passed object could be an instance of that type.
     * For example:
     *  Str.__includes__('') // true
     *  Str.__includes__(1)  // false
     */
    abstract __includes__: (props: IFuncProps, n: Primitive) => ESBoolean | Error;

    /**
     * Checks whether, treating the current object as a type, it is a subtype of the passed object.
     * For example:
     *  ''.__subtype_of__(Str); // true
     *  Str.__subtype_of__(''); // false
     *
     *  class A {};
     *  class B extends A {};
     *  A.__subtype_of__(B); // false
     *  B.__subtype_of__(A); // true
     */
    abstract __subtype_of__: (props: IFuncProps, n: Primitive) => ESBoolean | Error;
}
