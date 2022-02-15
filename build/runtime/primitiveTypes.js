import { global } from "../constants.js";
import { str } from '../util/util.js';
import { ESError, TypeError } from "../errors.js";
import { Position } from "../position.js";
import { Context, ESSymbol } from "./context.js";
import { createInstance } from "./instantiator.js";
import { call } from "./functionCaller.js";
export class ESPrimitive {
    /**
     * @param value
     * @param {ESType|false} type can ONLY be false for initialising the '__type__' ESType
     * @protected
     */
    constructor(value, type = types.any) {
        this.self = this;
        /**
         * @returns {boolean} this cast to a boolean. Uses __bool__ if method exists.
         */
        this.bool = () => {
            if (this.hasOwnProperty('__bool__'))
                // @ts-ignore
                return this['__bool__']();
            return new ESBoolean(!!this.__value__);
        };
        // getters for private props
        this.valueOf = () => this.__value__;
        this.typeOf = () => new ESString(this.__type__.__name__);
        // Object stuff
        this.hasProperty = ({}, key) => this.hasOwnProperty(key.valueOf());
        this.__getProperty__ = ({}, key) => {
            if (this.self.hasOwnProperty(key.valueOf()))
                return ESPrimitive.wrap(this.self[key.valueOf()]);
            return ESPrimitive.wrap(new ESUndefined());
        };
        // @ts-ignore
        this.__type__ = type || this;
        this.__value__ = value;
        this.info = {};
    }
    static wrap(thing = undefined) {
        if (thing instanceof ESPrimitive)
            return thing;
        if (thing === undefined || thing === null)
            return new ESUndefined();
        if (thing instanceof ESError)
            return new ESErrorPrimitive(thing);
        if (thing instanceof ESSymbol)
            return thing.value;
        if (typeof thing == 'function')
            return new ESFunction((p, ...args) => {
                const res = thing(p, ...args);
                if (res instanceof ESError || res instanceof ESPrimitive)
                    return res;
                ESPrimitive.wrap(res);
            });
        if (typeof thing === 'number')
            return new ESNumber(thing);
        if (typeof thing === 'string')
            return new ESString(thing);
        if (typeof thing === 'boolean')
            return new ESBoolean(thing);
        if (typeof thing === 'object') {
            if (Array.isArray(thing))
                return new ESArray(thing.map(s => ESPrimitive.wrap(s)));
            let newObj = {};
            Object.getOwnPropertyNames(thing).forEach(key => {
                newObj[key] = ESPrimitive.wrap(thing[key]);
            });
            return new ESObject(newObj);
        }
        if (typeof thing === 'bigint')
            return new ESNumber(Number(thing));
        if (typeof thing === 'symbol')
            return new ESString(String(thing));
        // for typeof === undefined
        return new ESUndefined();
    }
    /**
     * Returns the thing passed in its js form
     * @param {Primitive} thing
     */
    static strip(thing) {
        if (!thing)
            return undefined;
        if (!(thing instanceof ESPrimitive))
            return thing;
        if (thing instanceof ESArray)
            return thing.valueOf().map(m => ESPrimitive.strip(m));
        if (thing instanceof ESObject) {
            let val = {};
            for (let key in thing.valueOf())
                val[key] = ESPrimitive.strip(thing.valueOf()[key]);
            return val;
        }
        if (thing instanceof ESUndefined)
            return undefined;
        if (thing instanceof ESType || thing instanceof ESFunction)
            return thing;
        return thing.valueOf();
    }
}
export class ESType extends ESPrimitive {
    constructor(isPrimitive = false, name = '(anon)', __methods__ = [], __extends__, __init__) {
        super(undefined, types === null || types === void 0 ? void 0 : types.type);
        this.__instances__ = [];
        this.clone = (chain) => {
            var _a;
            return new ESType(this.__isPrimitive__, this.__name__, this.__methods__.map(f => f.clone(chain)), this.__extends__, (_a = this.__init__) === null || _a === void 0 ? void 0 : _a.clone(chain));
        };
        this.isa = ({}, type) => {
            return new ESBoolean(type === types.type);
        };
        this.cast = ({}, type) => {
            return this;
        };
        this.includesType = ({ context }, t) => {
            var _a, _b, _c, _d, _e, _f;
            if (this.equals({ context }, types.any).valueOf() === true ||
                t.equals({ context }, types.any).valueOf() === true ||
                (((_a = this.__extends__) === null || _a === void 0 ? void 0 : _a.equals({ context }, t).valueOf()) === true) ||
                (((_b = this.__extends__) === null || _b === void 0 ? void 0 : _b.equals({ context }, types.any).valueOf()) === true) ||
                (((_c = this.__extends__) === null || _c === void 0 ? void 0 : _c.includesType({ context }, t).valueOf()) === true) ||
                (((_d = t.__extends__) === null || _d === void 0 ? void 0 : _d.equals({ context }, this).valueOf()) === true) ||
                (((_e = t.__extends__) === null || _e === void 0 ? void 0 : _e.equals({ context }, types.any).valueOf()) === true) ||
                (((_f = t.__extends__) === null || _f === void 0 ? void 0 : _f.includesType({ context }, this).valueOf()) === true)) {
                return new ESBoolean(true);
            }
            return this.equals({ context }, t);
        };
        this.equals = ({}, t) => {
            return new ESBoolean(t.__name__ === this.__name__ &&
                t.__isPrimitive__ === this.__isPrimitive__ &&
                Object.is(this.valueOf(), t.valueOf()));
        };
        this.__call__ = ({ context }, ...params) => {
            return createInstance(this, { context }, params || []);
        };
        this.str = () => new ESString(`<Type: ${this.__name__}>`);
        this.__isPrimitive__ = isPrimitive;
        this.__name__ = name;
        this.info.name = name;
        this.__extends__ = __extends__;
        this.__methods__ = __methods__;
        if (__init__) {
            __init__.name = name;
            this.__init__ = __init__;
        }
        if (!types.type)
            this.__type__ = this;
    }
}
export class ESNumber extends ESPrimitive {
    constructor(value = 0) {
        super(value, types.number);
        this.isa = ({}, type) => {
            return new ESBoolean(type === types.number);
        };
        this.cast = ({}, type) => {
            switch (type) {
                case types.number:
                    return this;
                case types.string:
                    return this.str();
                case types.array:
                    return new ESArray(new Array(this.valueOf()));
                default:
                    return new ESError(Position.unknown, 'TypeError', `Cannot cast to type '${str(type.typeOf())}'`);
            }
        };
        this.str = () => new ESString(this.valueOf().toString());
        this.__add__ = ({}, n) => {
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
            return new ESNumber(this.valueOf() + n.valueOf());
        };
        this.__subtract__ = ({}, n) => {
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
            return new ESNumber(this.valueOf() - n.valueOf());
        };
        this.__multiply__ = ({}, n) => {
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
            return new ESNumber(this.valueOf() * n.valueOf());
        };
        this.__divide__ = ({}, n) => {
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
            return new ESNumber(this.valueOf() / n.valueOf());
        };
        this.__pow__ = ({}, n) => {
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
            return new ESNumber(Math.pow(this.valueOf(), n.valueOf()));
        };
        this.__eq__ = ({}, n) => {
            if (!(n instanceof ESNumber))
                return new ESBoolean(false);
            return new ESBoolean(this.valueOf() === n.valueOf());
        };
        this.__gt__ = ({}, n) => {
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
            return new ESBoolean(this.valueOf() > n.valueOf());
        };
        this.__lt__ = ({}, n) => {
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
            return new ESBoolean(this.valueOf() < n.valueOf());
        };
        this.__bool__ = () => {
            return new ESBoolean(this.valueOf() > 0);
        };
        this.clone = (chain) => new ESNumber(this.valueOf());
    }
}
export class ESString extends ESPrimitive {
    constructor(value = '') {
        super(value, types.string);
        this.str = () => this;
        this.isa = ({}, type) => {
            return new ESBoolean(type === types.string);
        };
        this.cast = ({}, type) => {
            switch (type) {
                case types.number:
                    const num = parseFloat(this.valueOf());
                    if (isNaN(num))
                        return new ESError(Position.unknown, 'TypeError', `This string is not a valid number`);
                    return new ESNumber(num);
                case types.string:
                    return this;
                case types.array:
                    return new ESArray(this.valueOf().split('').map(s => new ESString(s)));
                default:
                    return new ESError(Position.unknown, 'TypeError', `Cannot cast to type '${str(type.typeOf())}'`);
            }
        };
        this.__add__ = ({}, n) => {
            if (!(n instanceof ESString))
                return new TypeError(Position.unknown, 'String', n.typeOf().valueOf(), n.valueOf());
            return new ESString(this.valueOf() + n.valueOf());
        };
        this.__multiply__ = ({}, n) => {
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
            return new ESString(this.valueOf().repeat(n.valueOf()));
        };
        this.__eq__ = ({}, n) => {
            if (!(n instanceof ESString))
                return new ESBoolean(false);
            return new ESBoolean(this.valueOf() === n.valueOf());
        };
        this.__gt__ = ({}, n) => {
            if (!(n instanceof ESString))
                return new TypeError(Position.unknown, 'String', n.typeOf().valueOf(), n.valueOf());
            return new ESBoolean(this.valueOf().length > n.valueOf().length);
        };
        this.__lt__ = ({}, n) => {
            if (!(n instanceof ESString))
                return new TypeError(Position.unknown, 'String', n.typeOf().valueOf(), n.valueOf());
            return new ESBoolean(this.valueOf().length < n.valueOf().length);
        };
        this.__bool__ = () => {
            return new ESBoolean(this.valueOf().length > 0);
        };
        this.len = () => {
            return new ESNumber(this.valueOf().length);
        };
        this.clone = (chain) => new ESString(this.valueOf());
        this.__getProperty__ = ({}, key) => {
            if (key instanceof ESString && this.self.hasOwnProperty(str(key)))
                return ESPrimitive.wrap(this.self[str(key)]);
            if (!(key instanceof ESNumber))
                return new ESString();
            let idx = key.valueOf();
            while (idx < 0)
                idx = this.valueOf().length + idx;
            if (idx < this.valueOf().length)
                return new ESString(this.valueOf()[idx]);
            return new ESString();
        };
    }
    __setProperty__({}, key, value) {
        if (!(key instanceof ESNumber))
            return;
        if (!(value instanceof ESString))
            value = new ESString(str(value));
        let idx = key.valueOf();
        while (idx < 0)
            idx = this.valueOf().length + idx;
        const strToInsert = value.str().valueOf();
        let firstPart = this.__value__.substr(0, idx);
        let lastPart = this.__value__.substr(idx + strToInsert.length);
        this.__value__ = firstPart + strToInsert + lastPart;
    }
}
export class ESUndefined extends ESPrimitive {
    constructor() {
        super(undefined, types.undefined);
        this.isa = ({}, type) => {
            return new ESBoolean(type === types.string);
        };
        this.cast = ({ context }, type) => {
            switch (type) {
                case types.number:
                    return new ESNumber();
                case types.string:
                    return new ESString();
                case types.array:
                    return new ESArray();
                case types.undefined:
                    return new ESUndefined();
                case types.type:
                    return new ESType();
                case types.error:
                    return new ESErrorPrimitive();
                case types.object:
                case types.any:
                    return new ESObject();
                case types.function:
                    return new ESFunction(() => { });
                case types.boolean:
                    return new ESBoolean();
                default:
                    if (!(type instanceof ESType))
                        return new ESError(Position.unknown, 'TypeError', `Cannot cast to type '${str(type.typeOf())}'`);
                    return type.__call__({ context });
            }
        };
        this.str = () => new ESString('<Undefined>');
        this.__eq__ = ({}, n) => new ESBoolean(n instanceof ESUndefined || typeof n === 'undefined' || typeof n.valueOf() === 'undefined');
        this.__bool__ = () => new ESBoolean(false);
        this.clone = (chain) => new ESUndefined();
        // define the same info for every instance
        this.info = {
            name: 'undefined',
            description: 'Not defined, not a value.',
            file: 'built-in',
            isBuiltIn: true
        };
    }
}
export class ESErrorPrimitive extends ESPrimitive {
    constructor(error = new ESError(Position.unknown, 'Unknown', 'error type not specified')) {
        super(error, types.error);
        this.isa = ({}, type) => {
            return new ESBoolean(type === types.error);
        };
        this.cast = ({}) => {
            return new ESError(Position.unknown, 'TypeError', `Cannot cast type 'error'`);
        };
        this.str = () => new ESString(`<Error: ${this.valueOf().str}>`);
        this.__eq__ = ({}, n) => new ESBoolean(n instanceof ESErrorPrimitive && this.valueOf().constructor === n.valueOf().constructor);
        this.__bool__ = () => new ESBoolean(true);
        this.clone = (chain) => new ESErrorPrimitive(this.valueOf());
    }
}
export class ESFunction extends ESPrimitive {
    constructor(func = (() => { }), arguments_ = [], name = '(anonymous)', this_ = new ESObject(), returnType = types.any, closure = global) {
        super(func, types.function);
        this.isa = ({}, type) => {
            return new ESBoolean(type === types.function);
        };
        this.cast = ({}, type) => {
            return new ESError(Position.unknown, 'TypeError', `Cannot cast type 'function'`);
        };
        this.clone = (chain) => {
            return new ESFunction(this.__value__, this.arguments_, this.name, this.this_, this.returnType, this.__closure__);
        };
        // @ts-ignore
        this.valueOf = () => this;
        this.str = () => new ESString(`<Func: ${this.name}>`);
        this.__eq__ = ({}, n) => {
            if (!(n instanceof ESFunction))
                return new ESBoolean(false);
            return new ESBoolean(this.__value__ === n.__value__);
        };
        this.__bool__ = () => new ESBoolean(true);
        this.__call__ = ({ context }, ...params) => {
            return call(context, this, params);
        };
        this.arguments_ = arguments_;
        this.info.name = name;
        this.this_ = this_;
        this.returnType = returnType;
        this.__closure__ = closure !== null && closure !== void 0 ? closure : new Context();
        this.info.returnType = str(returnType);
        this.info.args = arguments_.map(arg => ({
            name: arg.name,
            defaultValue: str(arg.defaultValue),
            type: arg.type.info.name,
            required: true
        }));
        // TODO: info.helpLink
    }
    get name() {
        var _a;
        return (_a = this.info.name) !== null && _a !== void 0 ? _a : '(anonymous)';
    }
    set name(v) {
        this.info.name = v;
    }
}
export class ESBoolean extends ESPrimitive {
    constructor(val = false) {
        super(Boolean(val), types.bool);
        this.isa = ({}, type) => {
            return new ESBoolean(type === types.string);
        };
        this.cast = ({}, type) => {
            switch (type) {
                case types.number:
                    return new ESNumber(this.valueOf() ? 1 : 0);
                default:
                    return new ESError(Position.unknown, 'TypeError', `Cannot cast boolean to type '${str(type.typeOf())}'`);
            }
        };
        this.__eq__ = ({}, n) => {
            if (!(n instanceof ESBoolean)) {
                return new TypeError(Position.unknown, 'Boolean', n.typeOf().str().valueOf(), n.valueOf());
            }
            return new ESBoolean(this.valueOf() === n.valueOf());
        };
        this.__bool__ = () => this;
        this.__and__ = ({}, n) => {
            return new ESBoolean(this.bool().valueOf() && n.bool().valueOf());
        };
        this.__or__ = ({}, n) => {
            return new ESBoolean(this.bool().valueOf() || n.bool().valueOf());
        };
        this.str = () => new ESString(this.valueOf() ? 'true' : 'false');
        this.clone = (chain) => new ESBoolean(this.valueOf());
        this.info = {
            name: str(val),
            description: `Boolean global constant which evaluates to ${str(val)}, the opposite of ${str(!val)}`,
            file: 'built-in',
            isBuiltIn: true,
            helpLink: 'https://en.wikipedia.org/wiki/Boolean_expression'
        };
    }
}
export class ESObject extends ESPrimitive {
    constructor(val = {}) {
        super(val, types.object);
        this.isa = ({ context }, type) => {
            if (type === types.object)
                return new ESBoolean(true);
            if (!(type instanceof ESType))
                return new TypeError(Position.unknown, 'TypeError', 'type', str(type.typeOf()), str(type));
            return this.__type__.includesType({ context }, type);
        };
        this.cast = ({}, type) => {
            switch (type) {
                case types.number:
                    return new ESNumber(this.valueOf() ? 1 : 0);
                default:
                    return new ESError(Position.unknown, 'TypeError', `Cannot cast boolean to type '${str(type.typeOf())}'`);
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
        this.__add__ = ({ context }, n) => {
            if (!(n instanceof ESObject)) {
                return new TypeError(Position.unknown, 'object', n.typeOf().valueOf(), n);
            }
            let newOb = {};
            for (let k of this.keys) {
                const key = k.valueOf();
                newOb[key] = this.__getProperty__({ context }, k);
            }
            for (let k of n.keys) {
                const key = k.valueOf();
                if (newOb.hasOwnProperty(key)) {
                    continue;
                }
                newOb[key] = n.__getProperty__({ context }, k);
            }
            return new ESObject(newOb);
        };
        this.__subtract__ = ({ context }, n) => {
            let keysToRemove = [];
            if (n instanceof ESString) {
                keysToRemove = [str(n)];
            }
            else if (n instanceof ESArray) {
                keysToRemove = ESPrimitive.strip(n);
            }
            else {
                return new TypeError(Position.unknown, 'array | string', n.typeOf().valueOf(), n);
            }
            if (!Array.isArray(keysToRemove)) {
                return new TypeError(Position.unknown, 'array | string', n.typeOf().valueOf(), n);
            }
            let newOb = {};
            for (let k of this.keys) {
                const key = k.valueOf();
                if (keysToRemove.indexOf(key) === -1) {
                    newOb[key] = this.__getProperty__({ context }, k);
                }
            }
            return new ESObject(newOb);
        };
        this.__getProperty__ = ({}, key) => {
            if (key instanceof ESString && this.valueOf().hasOwnProperty(key.valueOf()))
                return this.valueOf()[key.valueOf()];
            if (this.self.hasOwnProperty(key.valueOf()))
                return ESPrimitive.wrap(this.self[key.valueOf()]);
            return new ESUndefined();
        };
        this.clone = (chain) => {
            let obj = {};
            let toClone = this.valueOf();
            for (let key in toClone) {
                try {
                    obj[key] = toClone[key].clone(chain);
                }
                catch (e) {
                    throw Error(`Couldn't clone ${str(toClone[key])} from ${this.info}`);
                }
            }
            return new ESObject(obj);
        };
    }
    get keys() {
        return Object.keys(this.valueOf()).map(s => new ESString(s));
    }
    set keys(val) { }
    __setProperty__({}, key, value) {
        if (!(key instanceof ESString))
            return;
        if (!(value instanceof ESPrimitive))
            value = ESPrimitive.wrap(value);
        this.__value__[key.valueOf()] = value;
    }
}
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
                    return new ESError(Position.unknown, 'TypeError', `Cannot cast boolean to type '${str(type.typeOf())}'`);
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
        this.__add__ = ({ context }, n) => {
            if (!(n instanceof ESArray)) {
                return new TypeError(Position.unknown, 'array', n.typeOf().valueOf(), n);
            }
            return new ESArray([...this.valueOf(), ...n.valueOf()]);
        };
        this.__bool__ = () => new ESBoolean(this.valueOf().length > 0);
        this.__getProperty__ = ({}, key) => {
            if (key instanceof ESString && this.self.hasOwnProperty(key.valueOf())) {
                return ESPrimitive.wrap(this.self[key.valueOf()]);
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
        // Util
        /**
         * Uses JS Array.prototype.splice
         * @param val value to insert
         * @param idx index to insert at, defaults to end of array
         */
        this.add = ({}, val, idx = new ESNumber(this.len - 1)) => {
            if (!(val instanceof ESPrimitive))
                throw 'adding non-primitive to array: ' + str(val);
            this.len++;
            this.__value__.splice(idx.valueOf(), 0, val);
            return new ESNumber(this.len);
        };
        /**
         * Uses JS Array.prototype.includes
         * @param val value to check for
         */
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
            value = ESPrimitive.wrap(value);
        }
        let idx = key.valueOf();
        while (idx < 0) {
            idx = this.valueOf().length + idx;
        }
        this.__value__[idx] = value;
    }
}
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
        this.__getProperty__ = ({}, key) => {
            if (key instanceof ESString && this.valueOf().hasOwnProperty(key.valueOf())) {
                const symbol = this.valueOf()[key.valueOf()];
                if (symbol.isAccessible)
                    return symbol.value;
            }
            if (this.self.hasOwnProperty(key.valueOf()))
                return ESPrimitive.wrap(this.self[key.valueOf()]);
            return new ESUndefined();
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
        if (!(key instanceof ESString))
            return;
        let idx = str(key);
        if (!this.mutable)
            return new TypeError(Position.unknown, 'mutable', 'immutable', `${str(this.name)}`);
        if (!(value instanceof ESPrimitive))
            value = ESPrimitive.wrap(value);
        const symbol = this.__value__[idx];
        if (!symbol)
            return new ESError(Position.unknown, 'SymbolError', `Symbol ${idx} is not declared in namespace ${str(this.name)}.`);
        if (symbol.isConstant)
            return new TypeError(Position.unknown, 'mutable', 'immutable', `${str(this.name)}.${idx}`);
        if (!symbol.isAccessible)
            return new TypeError(Position.unknown, 'accessible', 'inaccessible', `${str(this.name)}.${idx}`);
        symbol.value = value;
    }
}
export let types = {};
types.type = new ESType(true, 'Type');
types.undefined = new ESType(true, 'Undefined');
types.string = new ESType(true, 'String');
types.array = new ESType(true, 'Array');
types.number = new ESType(true, 'Number');
types.any = new ESType(true, 'Any');
types.function = new ESType(true, 'Function');
types.bool = new ESType(true, 'Boolean');
types.object = new ESType(true, 'Object');
types.error = new ESType(true, 'Error');
// Documentation for types
types.any.info = {
    name: 'any',
    description: 'Matches any other type',
    file: 'built-in',
    isBuiltIn: true
};
types.number.info = {
    name: 'any',
    description: 'The ES Number type. Is a a double-precision 64-bit binary format IEEE 754 value, like double in Java and C#',
    file: 'built-in',
    isBuiltIn: true
};
types.string.info = {
    name: 'string',
    description: 'The ES String type. Holds an array of characters, and can be defined with any of \', " and `. Can be indexed like an array.',
    file: 'built-in',
    isBuiltIn: true
};
types.bool.info = {
    name: 'bool',
    description: 'The ES Bool type. Exactly two instances exist, true and false.',
    file: 'built-in',
    isBuiltIn: true
};
types.function.info = {
    name: 'function',
    description: 'The ES Function type. Is a block of code which executes when called and takes in 0+ parameters.',
    file: 'built-in',
    isBuiltIn: true
};
types.array.info = {
    name: 'array',
    description: 'The ES Array type. Defines a set of items of any type which can be accessed by an index with [].',
    file: 'built-in',
    isBuiltIn: true
};
types.object.info = {
    name: 'object',
    description: 'The ES Object type. Similar to JS objects or python dictionaries.',
    file: 'built-in',
    isBuiltIn: true
};
types.error.info = {
    name: 'error',
    description: 'The ES Error type. Call to throw an error.',
    file: 'built-in',
    isBuiltIn: true
};
types.type.info = {
    name: 'type',
    description: 'The ES Type type. Call to get the type of a value at a string.',
    file: 'built-in',
    isBuiltIn: true
};
