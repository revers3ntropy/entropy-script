import { EndIterator, Error, InvalidOperationError, TypeError } from '../../errors';
import { funcProps, str } from '../../util/util';
import { ESBoolean } from './esboolean';
import { ESNumber } from './esnumber';
import { ESString } from './esstring';
import { ESPrimitive } from '../esprimitive';
import { ESUndefined } from './esundefined';
import type { Primitive } from '../primitive';
import { wrap } from '../wrapStrip';
import { types } from "../../util/constants";
import { ESType, ESTypeIntersection, ESTypeUnion } from "./estype";
import { ESErrorPrimitive } from "./eserrorprimitive";
import { ESIterable } from "./esiterable";

export class ESArray extends ESPrimitive <Primitive[]> implements ESIterable {
    override __iterable__ = true;

    constructor(values: Primitive[] = []) {
        super(values, types.array);
    }

    len = (): ESNumber => {
        return new ESNumber(this.__value__.length);
    };

    override cast = (props: funcProps, type: Primitive): Primitive | Error => {
        switch (type) {
            case types.number:
                return new ESNumber(this.len().__value__);
            case types.boolean:
                return this.bool();
            case types.string:
                return this.str();
            default:
                return new Error('TypeError', `Cannot cast 'Arr' to '${str(type)}'`);
        }
    }

    override str = (depth= new ESNumber) => {
        return new ESString(str(this.__value__, depth.__value__));
    }

    override __eq__ = (props: funcProps, n: Primitive): ESBoolean | Error => {
        if (!(n instanceof ESArray)) {
            return new ESBoolean();
        }

        if (n.len().__value__ !== this.len().__value__) {
            return new ESBoolean();
        }

        for (let i = 0; i < this.len().__value__; i++) {
            const thisElement = this.__value__[i];
            const nElement = n.__value__[i];

            if (!thisElement) {
                if (nElement) {
                    // this element is not defined but the other element is
                    return new ESBoolean();
                }
                continue;
            }

            if (!thisElement.__eq__) {
                return new ESBoolean();
            }

            const res = thisElement.__eq__(props, nElement);
            if (res instanceof Error) {
                return res;
            }

            if (!res.__value__) {
                return new ESBoolean();
            }
        }

        return new ESBoolean(true);
    };

    override __add__ = (props: funcProps, n: Primitive): ESArray | Error => {
        if (!(n instanceof ESArray)) {
            return new TypeError('array', n.__type_name__(), n);
        }

        return new ESArray([...this.__value__, ...n.__value__]);
    };

    override __bool__ = () => new ESBoolean(this.__value__.length > 0);
    override bool = this.__bool__;

    override __get__ = (props: funcProps, key: Primitive): Primitive => {
        if (key instanceof ESString && this._.hasOwnProperty(str(key))) {
            return wrap(this._[str(key)], true);
        }

        if (!(key instanceof ESNumber)) {
            return new ESUndefined();
        }

        let idx = key.__value__;

        while (idx < 0) {
            idx = this.__value__.length + idx;
        }

        if (idx < this.__value__.length) {
            return this.__value__[idx];
        }

        return new ESUndefined();
    };

    override __set__(props: funcProps, key: Primitive, value: Primitive): void {
        if (!(key instanceof ESNumber)) {
            return;
        }

        let idx = key.__value__;

        while (idx < 0) {
            idx = this.__value__.length + idx;
        }

        this.__value__[idx] = value;
    }

    contains = (props: funcProps, val: Primitive) => {
        for (let element of this.__value__) {
            if (val.__eq__(props, element)) {
                return true;
            }
        }
        return false;
    };

    override clone = (): ESArray => {
        const newArr = [];
        for (let element of this.__value__) {
            newArr.push(element);
        }
        return new ESArray(newArr);
    }

    override __includes__ = (props: funcProps, n: Primitive): ESBoolean | Error => {
        if (!(n instanceof ESArray) || this.len().__value__ !== n.len().__value__) {
            return new ESBoolean();
        }

        for (let i = 0; i < this.__value__.length; i++) {
            const res = this.__value__[i].__includes__(props, n.__value__[i]);
            if (res instanceof Error) return res;
            if (!res.__value__) {
                return new ESBoolean();
            }
        }
        return new ESBoolean(true);
    }

    override __subtype_of__ = (props: funcProps, n: Primitive): ESBoolean | Error => {
        if (!(n instanceof ESArray) || this.len().__value__ !== n.len().__value__) {
            return new ESBoolean();
        }

        for (let i = 0; i < this.__value__.length; i++) {
            const res = this.__value__[i].__subtype_of__(props, n.__value__[i]);
            if (res instanceof Error) return res;
            if (!res.__value__) {
                return new ESBoolean();
            }
        }
        return new ESBoolean(true);
    }

    override __pipe__ = (props: funcProps, n: Primitive): Primitive | Error => {
        return new ESTypeUnion(this, n);
    }
    override __ampersand__ = (props: funcProps, n: Primitive): Primitive | Error => {
        return new ESTypeIntersection(this, n);
    }

    override __iter__ = (): Error | Primitive => {
        return this.clone();
    }

    override __next__ = (): Error | Primitive => {
        if (this.__value__.length) {
            return wrap(this.__value__.shift());
        }
        return new ESErrorPrimitive(new EndIterator());
    }

    override keys = () => {
        let res: (ESNumber | ESString)[] = Object.keys(this._).map(s => new ESString(s));
        res.push(...Object.keys(this.__value__).map(s => new ESNumber(parseInt(s))))
        return res;
    }

    add = (props: funcProps, ...args: Primitive[]) => {
        this.__value__.push(...args);
    }
}

export class ESTypeArray extends ESType {
    private readonly __t__: Primitive;
    private __n_elements__: number = -1;

    constructor (type: Primitive) {
        super(false, `Array[${str(type)}]`);
        this.__t__ = type;
    }

    override __call__ = (): Error | Primitive => {
        return new InvalidOperationError('__call__', this);
    }

    override __includes__ = (props: funcProps, t: Primitive): ESBoolean | Error => {
        if (!(t instanceof ESArray)) {
            return new ESBoolean();
        }

        if (this.__n_elements__ >= 0) {
            if (t.__value__.length !== this.__n_elements__) {
                return new TypeError(
                    `Array[${str(this.__t__)}][${this.__n_elements__}]`,
                    `Array[Any][${t.__value__.length}]`
                );
            }
        }

        for (const element of t.__value__) {
            let typeRes = this.__t__.__includes__(props, element);
            if (typeRes instanceof Error) return typeRes;
            if (!typeRes.__value__) {
                return new ESBoolean();
            }
        }

        return new ESBoolean(true);
    }

    override __subtype_of__ = (props: funcProps, t: Primitive): ESBoolean | Error => {
        if (Object.is(t, types.any) || Object.is(t, types.array)) {
            return new ESBoolean(true);
        }

        if (!(t instanceof ESArray)) {
            return new ESBoolean();
        }

        if (this.__n_elements__ >= 0) {
            if (t.__value__.length !== this.__n_elements__) {
                return new TypeError(
                    `Array[${str(this.__t__)}][${this.__n_elements__}]`,
                    `Array[Any][${t.__value__.length}]`
                );
            }
        }

        for (const element of t.__value__) {
            let typeRes = this.__t__.__subtype_of__(props, element);
            if (typeRes instanceof Error) return typeRes;
            if (!typeRes.__value__) {
                return new ESBoolean();
            }
        }

        return new ESBoolean(true);
    }

    override clone = () => {
        return new ESTypeArray(this.__t__);
    }

    override __get__ = (props: funcProps, key: Primitive) => {
        if (key instanceof ESString && this._.hasOwnProperty(str(key))) {
            return wrap(this._[str(key)], true);
        }

        if (!(key instanceof ESNumber)) {
            return new TypeError('Number', key.__type_name__(), str(key));
        }

        this.__n_elements__ = key.__value__;

        return this;
    }

    override keys = () => {
        return Object.keys(this).map(s => new ESString(s));
    }
}