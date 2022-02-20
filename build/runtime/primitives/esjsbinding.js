import { ESError, IndexError, TypeError } from '../../errors.js';
import { Position } from '../../position.js';
import { ESBoolean } from './esboolean.js';
import { ESString } from './esstring.js';
import { ESPrimitive } from './esprimitive.js';
import { str } from '../../util/util.js';
import { types } from './primitive.js';
import { strip, wrap } from './wrapStrip.js';
import { ESFunction } from "./esfunction.js";
export class ESJSBinding extends ESPrimitive {
    constructor(value, name = '<AnonNative>', functionsTakeProps = false) {
        super(value, types.object);
        this.cast = ({}) => {
            return new ESError(Position.unknown, 'TypeError', `Cannot cast native object`);
        };
        this.clone = () => new ESJSBinding(this.__value__);
        this.str = () => {
            try {
                return new ESString(JSON.stringify(this.__value__));
            }
            catch (e) {
                return new ESString(`${this.__value__}`);
            }
        };
        this.__eq__ = ({}, n) => {
            return new ESBoolean(this === n);
        };
        this.__bool__ = () => new ESBoolean(true);
        this.bool = this.__bool__;
        this.__getProperty__ = (props, k) => {
            const key = str(k);
            const val = this.valueOf();
            const res = val[key];
            if (res === undefined) {
                const self = this;
                if (self.hasOwnProperty(key)) {
                    const val = this.self[str(key)];
                    if (typeof val === 'function') {
                        return new ESFunction(val);
                    }
                    return wrap(val);
                }
                return new IndexError(Position.unknown, key, this);
            }
            if (res instanceof ESPrimitive) {
                return res;
            }
            if (typeof res === 'function') {
                return new ESFunction(({ context }, ...args) => {
                    return val[key](...args.map(o => strip(o, props)));
                });
            }
            return new ESJSBinding(res);
        };
        this.__call__ = (props, ...args) => {
            if (typeof this.__value__ !== 'function') {
                return new TypeError(Position.unknown, 'function', typeof this.__value__, str(this));
            }
            let res;
            try {
                res = new this.__value__(...args.map(o => strip(o, props)));
            }
            catch (_a) {
                res = this.__value__(...args.map(o => strip(o, props)));
            }
            if (res instanceof ESPrimitive) {
                return res;
            }
            return new ESJSBinding(res);
        };
        this.hasProperty = (props, key) => {
            return new ESBoolean(!(this.__getProperty__(props, key) instanceof ESError));
        };
        this.info.name = str(name);
    }
}
