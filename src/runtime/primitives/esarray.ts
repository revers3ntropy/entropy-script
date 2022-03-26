import { EndIterator, Error, InvalidOperationError, TypeError } from '../../errors';
import Position from '../../position';
import { funcProps, str } from '../../util/util';
import { ESBoolean } from './esboolean';
import { ESNumber } from './esnumber';
import { ESString } from './esstring';
import { ESPrimitive } from './esprimitive';
import { ESUndefined } from './esundefined';
import type { Primitive } from './primitive';
import { wrap } from './wrapStrip';
import { types } from "../../util/constants";
import { ESType, ESTypeIntersection, ESTypeUnion } from "./estype";
import { ESErrorPrimitive } from "./eserrorprimitive";

export class ESArray extends ESPrimitive <Primitive[]> {
    constructor(values: Primitive[] = []) {
        super(values, types.array);
    }

    len = (props: funcProps): ESNumber => {
        return new ESNumber(this.valueOf().length);
    };

    override cast = (props: funcProps, type: Primitive): Primitive | Error => {
        switch (type) {
        case types.number:
            return new ESNumber(this.len(props).valueOf());
        case types.boolean:
            return this.bool();
        default:
            return new Error(Position.void, 'TypeError', `Cannot cast boolean to type '${str(type.typeName())}'`);
        }
    }

    override str = () => new ESString(str(this.valueOf()));

    override __eq__ = (props: funcProps, n: Primitive): ESBoolean | Error => {
        if (!(n instanceof ESArray)) {
            return new ESBoolean();
        }

        if (n.len(props).valueOf() !== this.len(props).valueOf()) {
            return new ESBoolean();
        }

        for (let i = 0; i < this.len(props).valueOf(); i++) {
            const thisElement = this.valueOf()[i];
            const nElement = n.valueOf()[i];

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

            if (!res.valueOf()) {
                return new ESBoolean();
            }
        }

        return new ESBoolean(true);
    };

    override __add__ = (props: funcProps, n: Primitive): ESArray | Error => {
        if (!(n instanceof ESArray)) {
            return new TypeError(Position.void, 'array', n.typeName().valueOf(), n);
        }

        return new ESArray([...this.valueOf(), ...n.valueOf()]);
    };

    override __bool__ = () => new ESBoolean(this.valueOf().length > 0);
    override bool = this.__bool__;

    override __get__ = (props: funcProps, key: Primitive): Primitive => {
        if (key instanceof ESString && this._.hasOwnProperty(str(key))) {
            return wrap(this._[str(key)], true);
        }

        if (!(key instanceof ESNumber)) {
            return new ESUndefined();
        }

        let idx = key.valueOf();

        while (idx < 0) {
            idx = this.valueOf().length + idx;
        }

        if (idx < this.valueOf().length) {
            return this.valueOf()[idx];
        }

        return new ESUndefined();
    };

    override __set__(props: funcProps, key: Primitive, value: Primitive): void {
        if (!(key instanceof ESNumber)) {
            return;
        }

        if (!(value instanceof ESPrimitive)) {
            value = wrap(value);
        }

        let idx = key.valueOf();

        while (idx < 0) {
            idx = this.valueOf().length + idx;
        }

        this.__value__[idx] = value;
    }

    // Util

    /**
     * Uses JS Array.prototype.includes
     */
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
        for (let element of this.valueOf()) {
            newArr.push(element);
        }
        return new ESArray(newArr);
    }

    override type_check = (props: funcProps, n: Primitive): ESBoolean | Error => {
        if (!(n instanceof ESArray) || this.len(props).valueOf() !== n.len(props).valueOf()) {
            return new ESBoolean();
        }

        for (let i = 0; i < this.__value__.length; i++) {
            const res = this.__value__[i].type_check(props, n.__value__[i]);
            if (res instanceof Error) return res;
            if (!res.valueOf()) {
                return new ESBoolean();
            }
        }
        return new ESBoolean(true)
    }

    override __pipe__ (props: funcProps, n: Primitive): Primitive | Error {
        return new ESTypeUnion(this, n);
    }
    override __ampersand__ (props: funcProps, n: Primitive): Primitive | Error {
        return new ESTypeIntersection(this, n);
    }

    override __iter__(props: funcProps): Error | Primitive {
        return this.clone();
    }

    override __next__(props: funcProps): Error | Primitive {
        if (this.__value__.length) {
            return wrap(this.__value__.shift());
        } else {
            return new ESErrorPrimitive(new EndIterator());
        }
    }
}

export class ESTypeArray extends ESType {
    private readonly type: Primitive;
    private numElements: number = -1;

    constructor (type: Primitive) {
        super(false, `Array[${str(type)}]`);
        this.type = type;
    }

    override __call__ = (props: funcProps, ...params: Primitive[]): Error | Primitive => {
        return new InvalidOperationError('__call__', this);
    }

    override type_check = (props: funcProps, t: Primitive): ESBoolean | Error => {
        if (!(t instanceof ESArray)) {
            return new ESBoolean();
        }

        if (this.numElements >= 0) {
            if (t.valueOf().length !== this.numElements) {
                return new TypeError(Position.void,
                    `Array[${str(this.type)}][${this.numElements}]`,
                    `Array[Any][${t.valueOf().length}]`);
            }
        }

        for (const element of t.valueOf()) {
            if (!this.type.type_check(props, element).valueOf()) {
                return new ESBoolean();
            }
        }

        return new ESBoolean(true);
    }

    override clone = () => {
        return new ESTypeArray(this.type);
    }

    override __get__ = (props: funcProps, key: Primitive) => {
        if (key instanceof ESString && this._.hasOwnProperty(str(key))) {
            return wrap(this._[str(key)], true);
        }

        if (!(key instanceof ESNumber)) {
            return new TypeError(Position.void, 'Number', key.typeName(), str(key));
        }

        this.numElements = key.valueOf();

        return this;
    }
}