import { ESError, TypeError } from '../../errors.js';
import { Position } from '../../position.js';
import { str } from '../../util/util.js';
import { ESArray } from './esarray.js';
import { ESBoolean } from './esboolean.js';
import { ESNumber } from './esnumber.js';
import { ESString } from './esstring.js';
import { ESType } from './estype.js';
import { ESPrimitive } from './esprimitive.js';
import { ESUndefined } from './esundefined.js';
import { types } from './primitive.js';
import { strip, wrap } from './wrapStrip.js';
export class ESObject extends ESPrimitive {
    constructor(val = {}) {
        super(val, types.object);
        this.isa = ({ context }, type) => {
            if (type === types.object) {
                return new ESBoolean(true);
            }
            if (!(type instanceof ESType)) {
                return new TypeError(Position.unknown, 'TypeError', 'type', str(type.typeName()), str(type));
            }
            return this.__type__.includesType({ context }, type);
        };
        this.cast = ({}, type) => {
            switch (type) {
                case types.number:
                    return new ESNumber(this.valueOf() ? 1 : 0);
                default:
                    return new ESError(Position.unknown, 'TypeError', `Cannot cast boolean to type '${str(type.typeName())}'`);
            }
        };
        this.str = () => {
            let val = str(this.valueOf());
            // remove trailing new line
            if (val[val.length - 1] === '\n')
                val = val.substr(0, val.length - 1);
            return new ESString(`<ESObject ${val}>`);
        };
        this.__eq__ = ({ context }, n) => {
            if (!(n instanceof ESObject)) {
                return new ESBoolean();
            }
            if (n.keys.length !== this.keys.length) {
                return new ESBoolean();
            }
            for (let k of this.keys) {
                const key = k.valueOf();
                const thisElement = this.valueOf()[key];
                const nElement = n.valueOf()[key];
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
        this.__bool__ = () => new ESBoolean(true);
        this.bool = this.__bool__;
        this.__add__ = ({ context }, n) => {
            if (!(n instanceof ESObject)) {
                return new TypeError(Position.unknown, 'object', n.typeName().valueOf(), n);
            }
            let newOb = {};
            for (let k of this.keys) {
                const key = k.valueOf();
                const res = this.__getProperty__({ context }, k);
                if (res instanceof ESError) {
                    return res;
                }
                newOb[key] = res;
            }
            for (let k of n.keys) {
                const key = k.valueOf();
                if (newOb.hasOwnProperty(key)) {
                    continue;
                }
                const res = n.__getProperty__({ context }, k);
                if (res instanceof ESError) {
                    return res;
                }
                newOb[key] = res;
            }
            return new ESObject(newOb);
        };
        this.__subtract__ = ({ context }, n) => {
            let keysToRemove = [];
            if (n instanceof ESString) {
                keysToRemove = [str(n)];
            }
            else if (n instanceof ESArray) {
                keysToRemove = strip(n);
            }
            else {
                return new TypeError(Position.unknown, 'array | string', n.typeName().valueOf(), n);
            }
            if (!Array.isArray(keysToRemove)) {
                return new TypeError(Position.unknown, 'array | string', n.typeName().valueOf(), n);
            }
            let newOb = {};
            for (let k of this.keys) {
                const key = k.valueOf();
                if (keysToRemove.indexOf(key) === -1) {
                    let res = this.__getProperty__({ context }, k);
                    if (res instanceof ESError) {
                        return res;
                    }
                    newOb[key] = res;
                }
            }
            return new ESObject(newOb);
        };
        this.__getProperty__ = ({}, k) => {
            if (!(k instanceof ESString)) {
                return new TypeError(Position.unknown, 'string', k.typeName(), str(k));
            }
            const key = k.valueOf();
            if (this.valueOf().hasOwnProperty(key)) {
                return this.valueOf()[key];
            }
            if (this.self.hasOwnProperty(key)) {
                return wrap(this.self[key]);
            }
            return new ESUndefined();
        };
        this.__setProperty__ = ({}, key, value) => {
            if (!(key instanceof ESString)) {
                return new TypeError(Position.unknown, 'string', key.typeName(), str(key));
            }
            this.__value__[key.valueOf()] = value;
        };
        this.hasProperty = ({}, k) => {
            const key = str(k);
            if (this.valueOf().hasOwnProperty(str(key))) {
                return new ESBoolean(true);
            }
            return new ESBoolean(this.hasOwnProperty(key));
        };
        this.clone = (chain) => {
            let obj = {};
            let toClone = this.valueOf();
            for (let key of Object.keys(toClone)) {
                try {
                    obj[key] = toClone[key].clone(chain);
                }
                catch (e) {
                    obj[key] = toClone[key];
                }
            }
            return new ESObject(obj);
        };
    }
    get keys() {
        return Object.keys(this.valueOf()).map(s => new ESString(s));
    }
    set keys(val) { }
}
