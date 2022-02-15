import { ESError, IndexError, TypeError } from '../../errors.js';
import { Position } from '../../position.js';
import { ESBoolean } from './esboolean.js';
import { ESString } from './esstring.js';
import { ESPrimitive } from './esprimitive.js';
import { str } from '../../util/util.js';
import { types } from './primitive.js';
import { wrap } from './wrapStrip.js';
export class ESNamespace extends ESPrimitive {
    constructor(name, value, mutable = false) {
        super(value, types.object);
        this.isa = ({}, type) => {
            return new ESBoolean(type === types.object);
        };
        this.cast = ({}) => {
            return new ESError(Position.unknown, 'TypeError', `Cannot cast type 'namespace'`);
        };
        this.clone = (chain) => {
            let obj = {};
            let toClone = this.valueOf();
            for (let key in toClone) {
                obj[key] = toClone[key].clone();
            }
            return new ESNamespace(this.name, obj);
        };
        this.str = () => {
            const keys = Object.keys(this.valueOf());
            return new ESString(`<Namespace ${str(this.name)}: ${keys.slice(0, 5)}${keys.length >= 5 ? '...' : ''}>`);
        };
        this.__eq__ = ({}, n) => {
            return new ESBoolean(this === n);
        };
        this.__bool__ = () => new ESBoolean(true);
        this.bool = this.__bool__;
        this.__getProperty__ = ({}, key) => {
            if (key instanceof ESString && this.valueOf().hasOwnProperty(key.valueOf())) {
                const symbol = this.valueOf()[key.valueOf()];
                if (symbol.isAccessible) {
                    return symbol.value;
                }
            }
            if (this.self.hasOwnProperty(key.valueOf())) {
                return wrap(this.self[key.valueOf()]);
            }
            return new IndexError(Position.unknown, key.valueOf(), this.self);
        };
        this.info.name = str(name);
        this.mutable = mutable;
    }
    get name() {
        return new ESString(this.info.name);
    }
    set name(v) {
        this.info.name = v.valueOf();
    }
    __setProperty__({}, key, value) {
        if (!(key instanceof ESString)) {
            return new TypeError(Position.unknown, 'string', key.typeName().valueOf(), str(key));
        }
        let idx = str(key);
        if (!this.mutable) {
            return new TypeError(Position.unknown, 'mutable', 'immutable', `${str(this.name)}`);
        }
        if (!(value instanceof ESPrimitive)) {
            value = wrap(value);
        }
        const symbol = this.__value__[idx];
        if (!symbol) {
            return new ESError(Position.unknown, 'SymbolError', `Symbol ${idx} is not declared in namespace ${str(this.name)}.`);
        }
        if (symbol.isConstant) {
            return new TypeError(Position.unknown, 'mutable', 'immutable', `${str(this.name)}.${idx}`);
        }
        if (!symbol.isAccessible) {
            return new TypeError(Position.unknown, 'accessible', 'inaccessible', `${str(this.name)}.${idx}`);
        }
        symbol.value = value;
    }
}
