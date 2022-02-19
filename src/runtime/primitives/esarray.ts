import {ESError, TypeError} from '../../errors.js';
import {Position} from '../../position.js';
import {Context} from '../context.js';
import {str} from '../../util/util.js';
import {ESBoolean} from './esboolean.js';
import {ESNumber} from './esnumber.js';
import {ESString} from './esstring.js';
import {ESPrimitive} from './esprimitive.js';
import {ESUndefined} from './esundefined.js';
import {Primitive, types} from './primitive.js';
import {wrap} from './wrapStrip.js';
import { ESFunction } from "./esfunction.js";

export class ESArray extends ESPrimitive <Primitive[]> {
    len: number;

    constructor(values: Primitive[] = []) {
        super(values, types.array);
        this.len = values.length;
    }

    cast = ({}, type: Primitive): Primitive | ESError => {
        switch (type) {
        case types.number:
            return new ESNumber(this.len);
        case types.boolean:
            return this.bool();
        default:
            return new ESError(Position.unknown, 'TypeError', `Cannot cast boolean to type '${str(type.typeName())}'`);
        }
    }

    str = () => new ESString(str(this.valueOf()));

    __eq__ = ({context}: {context: Context}, n: Primitive): ESBoolean | ESError => {
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

    __add__ = ({context}: {context: Context}, n: Primitive): ESArray | ESError => {
        if (!(n instanceof ESArray)) {
            return new TypeError(Position.unknown, 'array', n.typeName().valueOf(), n);
        }

        return new ESArray([...this.valueOf(), ...n.valueOf()]);
    };

    __bool__ = () => new ESBoolean(this.valueOf().length > 0);
    bool = this.__bool__;

    __getProperty__ = ({}: {context: Context}, key: Primitive): Primitive => {
        if (key instanceof ESString && this.self.hasOwnProperty(str(key))) {
            const val = this.self[str(key)];
            if (typeof val === 'function') {
                return new ESFunction(val);
            }
            return wrap(val);
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

    __setProperty__({}: {context: Context}, key: Primitive, value: Primitive): void {
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
     * Uses JS Array.prototype.splice
     * @param val value to insert
     * @param idx index to insert at, defaults to end of array
     */
    add = ({}: {context: Context}, val: Primitive, idx: Primitive = new ESNumber(this.len - 1)) => {
        if (!(val instanceof ESPrimitive))
            throw 'adding non-primitive to array: ' + str(val);
        this.len++;
        this.__value__.splice(idx.valueOf(), 0, val);
        return new ESNumber(this.len);
    }

    /**
     * Uses JS Array.prototype.includes
     * @param val value to check for
     */
    contains = ({}: {context: Context}, val: Primitive) => {
        for (let element of this.__value__)
            if (val.valueOf() == element.valueOf())
                return true;
        return false;
    };

    clone = (): ESArray => {
        const newArr = [];
        for (let element of this.valueOf()) {
            newArr.push(element);
        }
        return new ESArray(newArr);
    }
}
