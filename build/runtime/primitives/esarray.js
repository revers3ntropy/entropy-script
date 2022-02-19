import { ESError, TypeError } from '../../errors.js';
import { Position } from '../../position.js';
import { str } from '../../util/util.js';
import { ESBoolean } from './esboolean.js';
import { ESNumber } from './esnumber.js';
import { ESString } from './esstring.js';
import { ESPrimitive } from './esprimitive.js';
import { ESUndefined } from './esundefined.js';
import { types } from './primitive.js';
import { wrap } from './wrapStrip.js';
export class ESArray extends ESPrimitive {
    constructor(values = []) {
        super(values, types.array);
        this.isa = ({}, type) => {
            return new ESBoolean(type === types.array);
        };
        this.cast = ({}, type) => {
            switch (type) {
                case types.number:
                    return new ESNumber(this.len);
                case types.boolean:
                    return this.bool();
                default:
                    return new ESError(Position.unknown, 'TypeError', `Cannot cast boolean to type '${str(type.typeName())}'`);
            }
        };
        this.str = () => new ESString(str(this.valueOf()));
        this.__eq__ = ({ context }, n) => {
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
                        return new ESBoolean();
                    }
                    continue;
                }
                if (!thisElement.__eq__) {
                    return new ESBoolean();
                }
                const res = thisElement.__eq__({ context }, nElement);
                if (res instanceof ESError) {
                    return res;
                }
                if (!res.valueOf()) {
                    return new ESBoolean();
                }
            }
            return new ESBoolean(true);
        };
        this.__add__ = ({ context }, n) => {
            if (!(n instanceof ESArray)) {
                return new TypeError(Position.unknown, 'array', n.typeName().valueOf(), n);
            }
            return new ESArray([...this.valueOf(), ...n.valueOf()]);
        };
        this.__bool__ = () => new ESBoolean(this.valueOf().length > 0);
        this.bool = this.__bool__;
        this.__getProperty__ = ({}, key) => {
            if (key instanceof ESString && this.self.hasOwnProperty(key.valueOf())) {
                return wrap(this.self[key.valueOf()]);
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
        this.add = ({}, val, idx = new ESNumber(this.len - 1)) => {
            if (!(val instanceof ESPrimitive))
                throw 'adding non-primitive to array: ' + str(val);
            this.len++;
            this.__value__.splice(idx.valueOf(), 0, val);
            return new ESNumber(this.len);
        };
        this.contains = ({}, val) => {
            for (let element of this.__value__)
                if (val.valueOf() == element.valueOf())
                    return true;
            return false;
        };
        this.clone = (chain) => {
            const newArr = [];
            for (let element of this.valueOf()) {
                newArr.push(element.clone(chain));
            }
            return new ESArray(newArr);
        };
        this.len = values.length;
    }
    __setProperty__({}, key, value) {
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
}
