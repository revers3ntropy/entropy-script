import { EndIterator, Error, TypeError } from '../../errors';
import { IFuncProps, Primitive, str } from '../../util/util';
import { ESBoolean } from './boolean';
import { ESNumber } from './number';
import { ESString } from './string';
import { ESPrimitive } from '../primitive';
import { ESNull } from './null';
import { wrap } from '../wrapStrip';
import { types } from "../../util/constants";
import { ESTypeUnion } from "./type";
import { ESErrorPrimitive } from "./error";
import { Iterable } from "./iterable";
import { ESTypeIntersection } from "./intersection";

export class ESArray extends ESPrimitive <Primitive[]> implements Iterable {
    override __iterable__ = true;

    constructor(values: Primitive[] = []) {
        super(values, types.array);
    }

    len = (): ESNumber => {
        return new ESNumber(this.__value__.length);
    };

    override cast = (props: IFuncProps, type: Primitive): Primitive | Error => {
        switch (type) {
            case types.number:
                return new ESNumber(this.len().__value__);
            case types.boolean:
                return this.bool();
            case types.string:
                return this.str(props);
            default:
                return new Error('TypeError', `Cannot cast 'Arr' to '${str(type)}'`);
        }
    }

    override str = (props: IFuncProps, depth= new ESNumber) => {
        return new ESString(str(this.__value__, depth.__value__));
    }

    override __eq__ = (props: IFuncProps, n: Primitive): ESBoolean | Error => {
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

    override __add__ = (props: IFuncProps, n: Primitive): ESArray | Error => {
        if (!n.__iterable__) {
            return new TypeError('IIterable', n.__type_name__(), str(n));
        }

        const arr = this.clone();

        const iterator = n.__iter__(props);
        if (iterator instanceof Error) return iterator;

        while (true) {
            const element = iterator.__next__(props);
            if (element instanceof Error) {
                return element;
            }
            if (element instanceof ESErrorPrimitive && element.__value__.name === 'EndIterator') {
                break;
            }
            arr.add(props, element);
        }

        return arr;
    };

    override __bool__ = () => new ESBoolean(this.__value__.length > 0);
    override bool = this.__bool__;

    override __get__ = (props: IFuncProps, key: Primitive): Primitive => {
        if (key instanceof ESString && str(key) in this._) {
            return wrap(this._[str(key)], true);
        }

        if (!(key instanceof ESNumber)) {
            return new ESNull();
        }

        let idx = key.__value__;

        while (idx < 0) {
            idx = this.__value__.length + idx;
        }

        if (idx < this.__value__.length) {
            return this.__value__[idx];
        }

        return new ESNull();
    };

    override __set__ = (props: IFuncProps, key: Primitive, value: Primitive): void => {
        if (!(key instanceof ESNumber)) {
            return;
        }

        let idx = key.__value__;

        while (idx < 0) {
            idx = this.__value__.length + idx;
        }

        this.__value__[idx] = value;
    }

    contains = (props: IFuncProps, val: Primitive) => {
        for (const element of this.__value__) {
            if (val.__eq__(props, element)) {
                return new ESBoolean(true);
            }
        }
        return new ESBoolean();
    };

    override clone = (): ESArray => {
        return new ESArray([...this.__value__]);
    }

    override __includes__ = (props: IFuncProps, n: Primitive): ESBoolean | Error => {
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

    override __subtype_of__ = (props: IFuncProps, n: Primitive): ESBoolean | Error => {
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

    override __pipe__ = (props: IFuncProps, n: Primitive): Primitive | Error => {
        return new ESTypeUnion(this, n);
    }
    override __ampersand__ = (props: IFuncProps, n: Primitive): Primitive | Error => {
        return new ESTypeIntersection(this, n);
    }

    override __iter__ = this.clone;

    override __next__ = (): Error | Primitive => {
        if (this.__value__.length) {
            return wrap(this.__value__.shift());
        }
        return new ESErrorPrimitive(new EndIterator());
    }

    override keys = () => {
        const res: (ESNumber | ESString)[] = Object.keys(this._).map(s => new ESString(s));
        res.push(...Object.keys(this.__value__).map(s => new ESNumber(parseInt(s))))
        return res;
    }

    add = (props: IFuncProps, ...args: Primitive[]) => {
        this.__value__.push(...args);
    }
}
