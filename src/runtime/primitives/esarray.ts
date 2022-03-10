import {ESError, TypeError} from '../../errors';
import {Position} from '../../position';
import {Context} from '../context';
import { funcProps, str } from '../../util/util';
import {ESBoolean} from './esboolean';
import {ESNumber} from './esnumber';
import {ESString} from './esstring';
import {ESPrimitive} from './esprimitive';
import {ESUndefined} from './esundefined';
import type {Primitive} from './primitive';
import {wrap} from './wrapStrip';
import { types } from "../../constants";
import { ESTypeIntersection, ESTypeUnion } from "./estype";

export class ESArray extends ESPrimitive <Primitive[]> {
    len: number;

    constructor(values: Primitive[] = []) {
        super(values, types.array);
        this.len = values.length;
    }

    override cast = ({}, type: Primitive): Primitive | ESError => {
        switch (type) {
        case types.number:
            return new ESNumber(this.len);
        case types.boolean:
            return this.bool();
        default:
            return new ESError(Position.void, 'TypeError', `Cannot cast boolean to type '${str(type.typeName())}'`);
        }
    }

    override str = () => new ESString(str(this.valueOf()));

    override __eq__ = ({context}: {context: Context}, n: Primitive): ESBoolean | ESError => {
        if (!(n instanceof ESArray)) {
            return new ESBoolean();
        }

        if (n.len !== this.len) {
            return new ESBoolean();
        }

        for (let i = 0; i < this.len; i++) {
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

            const res = thisElement.__eq__({context}, nElement);
            if (res instanceof ESError) {
                return res;
            }
            if (!res.valueOf()) {
                return new ESBoolean();
            }
        }

        return new ESBoolean(true);
    };

    override __add__ = ({context}: {context: Context}, n: Primitive): ESArray | ESError => {
        if (!(n instanceof ESArray)) {
            return new TypeError(Position.void, 'array', n.typeName().valueOf(), n);
        }

        return new ESArray([...this.valueOf(), ...n.valueOf()]);
    };

    override __bool__ = () => new ESBoolean(this.valueOf().length > 0);
    override bool = this.__bool__;

    override __getProperty__ = (props: funcProps, key: Primitive): Primitive => {
        if (key instanceof ESString && this.self.hasOwnProperty(str(key))) {
            return wrap(this.self[str(key)], true);
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

    override __setProperty__(props: funcProps, key: Primitive, value: Primitive): void {
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

    override typeCheck = (props: funcProps, n: Primitive): ESBoolean | ESError => {
        if (!(n instanceof ESArray) || this.len !== n.len) {
            return new ESBoolean();
        }
        for (let i = 0; i < this.__value__.length; i++) {
            const res = this.__value__[i].typeCheck(props, n.__value__[i]);
            if (res instanceof ESError) return res;
            if (!res.valueOf()) {
                return new ESBoolean();
            }
        }
        return new ESBoolean(true)
    }

    override __pipe__ (props: funcProps, n: Primitive): Primitive | ESError {
        return new ESTypeUnion(this, n);
    }
    override __ampersand__ (props: funcProps, n: Primitive): Primitive | ESError {
        return new ESTypeIntersection(this, n);
    }
}
