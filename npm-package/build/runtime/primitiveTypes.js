import { global } from "../constants.js";
import { str } from "../util/util.js";
import { ESError, TypeError } from "../errors.js";
import { Position } from "../position.js";
import { Node } from "./nodes.js";
import { Context, ESSymbol, generateESFunctionCallContext } from "./context.js";
export class ESPrimitive {
    /**
     * @param value
     * @param {ESType|false} type can ONLY be false for initialising the '__type__' ESType
     * @protected
     */
    constructor(value, type = types.any) {
        this.info = {};
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
        this.hasProperty = (key) => this.hasOwnProperty(key.valueOf());
        this.__getProperty__ = (key) => {
            const self = this;
            if (self.hasOwnProperty(key.valueOf()))
                return ESPrimitive.wrap(self[key.valueOf()]);
            return ESPrimitive.wrap(new ESUndefined());
        };
        // @ts-ignore
        this.__type__ = type || this;
        this.__value__ = value;
    }
    static wrap(thing = undefined) {
        if (thing instanceof ESPrimitive)
            return thing;
        // catch 'null' which is of type 'object'
        if (thing == undefined)
            return new ESUndefined();
        if (thing instanceof ESError)
            return new ESErrorPrimitive(thing);
        if (thing instanceof ESSymbol)
            return thing.value;
        if (typeof thing == 'function')
            return new ESFunction(thing);
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
            if (thing === Math)
                console.log();
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
        this.clone = () => {
            var _b;
            return new ESType(this.__isPrimitive__, this.__name__, this.__methods__.map(f => f.clone()), this.__extends__, (_b = this.__init__) === null || _b === void 0 ? void 0 : _b.clone());
        };
        this.includesType = (t) => {
            var _b, _c, _d, _e, _f, _g;
            if (this.equals(types.any) || t.equals(types.any))
                return true;
            if ((_b = this.__extends__) === null || _b === void 0 ? void 0 : _b.equals(t))
                return true;
            if ((_c = this.__extends__) === null || _c === void 0 ? void 0 : _c.equals(types.any))
                return true;
            if ((_d = this.__extends__) === null || _d === void 0 ? void 0 : _d.includesType(t))
                return true;
            if ((_e = t.__extends__) === null || _e === void 0 ? void 0 : _e.equals(this))
                return true;
            if ((_f = t.__extends__) === null || _f === void 0 ? void 0 : _f.equals(types.any))
                return true;
            if ((_g = t.__extends__) === null || _g === void 0 ? void 0 : _g.includesType(this))
                return true;
            return this.equals(t);
        };
        this.equals = (t) => {
            return t.__name__ === this.__name__ && t.__isPrimitive__ === this.__isPrimitive__ && Object.is(this.valueOf(), t.valueOf());
        };
        this.__call__ = (params = [], context = global, runInit = true, on = {}) => {
            var _b, _c, _d;
            if (this.__isPrimitive__) {
                // make sure we have at least one arg
                if (params.length < 1)
                    return new ESUndefined();
                switch (this.__name__) {
                    case 'Undefined':
                    case 'Type':
                        if (params.length < 1)
                            return new ESType();
                        else
                            return params[0].typeOf();
                    case 'String':
                        return new ESString(params[0].str().valueOf());
                    case 'Array':
                        return new ESArray(params);
                    case 'Number':
                        return new ESNumber(params[0].valueOf());
                    case 'Function':
                        return new ESFunction(params[0].valueOf());
                    case 'Boolean':
                        return new ESBoolean(params[0].bool().valueOf());
                    case 'Object':
                        return new ESObject(params[0]);
                    case 'Error':
                        return new ESError(Position.unknown, 'UserError', params[0].str().valueOf());
                    default:
                        return ESPrimitive.wrap(params[0]);
                }
            }
            // old code from N_class.genInstance - create instance of class
            function dealWithExtends(context_, class_, instance) {
                const constructor = instance.constructor;
                if (!class_)
                    return;
                if (!(class_ instanceof ESType))
                    return new TypeError(Position.unknown, 'Type', typeof class_, class_);
                let setRes = context_.setOwn('super', new ESFunction(() => {
                    var _b;
                    const newContext = new Context();
                    newContext.parent = context;
                    let setRes = newContext.setOwn('this', new ESObject(instance));
                    if (setRes instanceof ESError)
                        return setRes;
                    if (class_.__extends__ !== undefined) {
                        let _a = dealWithExtends(newContext, class_.__extends__, instance);
                        if (_a instanceof ESError)
                            return _a;
                    }
                    const res_ = (_b = class_ === null || class_ === void 0 ? void 0 : class_.__init__) === null || _b === void 0 ? void 0 : _b.__call__([]);
                    if (res_ instanceof ESPrimitive)
                        return res_;
                }));
                if (setRes instanceof ESError)
                    return setRes;
                const res = class_.__call__([], context, false, instance);
                if (res instanceof ESError)
                    return res;
                instance = res.valueOf();
                instance.constructor = constructor;
            }
            const newContext = new Context();
            newContext.parent = (_b = this.__init__) === null || _b === void 0 ? void 0 : _b.__closure__;
            if (this.__extends__) {
                let _a = dealWithExtends(newContext, this.__extends__, on);
                if (_a instanceof ESError)
                    return _a;
            }
            on['constructor'] = (_d = (_c = this.__init__) === null || _c === void 0 ? void 0 : _c.clone()) !== null && _d !== void 0 ? _d : new ESUndefined();
            const instance = new ESObject(on);
            for (let method of this.__methods__) {
                const methodClone = method.clone();
                methodClone.this_ = instance;
                on[method.name] = methodClone;
            }
            if (runInit && this.__init__) {
                this.__init__.this_ = instance;
                // newContext, which inherits from the current closure
                this.__init__.__closure__ = newContext;
                const res = this.__init__.__call__(params);
                // return value of init is ignored
                if (res instanceof ESError)
                    return res;
            }
            instance.__type__ = this;
            this.__instances__.push(instance);
            return instance;
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
        this.str = () => new ESString(this.valueOf().toString());
        this.__add__ = (n) => {
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
            return new ESNumber(this.valueOf() + n.valueOf());
        };
        this.__subtract__ = (n) => {
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
            return new ESNumber(this.valueOf() - n.valueOf());
        };
        this.__multiply__ = (n) => {
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
            return new ESNumber(this.valueOf() * n.valueOf());
        };
        this.__divide__ = (n) => {
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
            return new ESNumber(this.valueOf() / n.valueOf());
        };
        this.__pow__ = (n) => {
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
            return new ESNumber(Math.pow(this.valueOf(), n.valueOf()));
        };
        this.__eq__ = (n) => {
            if (!(n instanceof ESNumber))
                return new ESBoolean(false);
            return new ESBoolean(this.valueOf() === n.valueOf());
        };
        this.__gt__ = (n) => {
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
            return new ESBoolean(this.valueOf() > n.valueOf());
        };
        this.__lt__ = (n) => {
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
            return new ESBoolean(this.valueOf() < n.valueOf());
        };
        this.__bool__ = () => {
            return new ESBoolean(this.valueOf() > 0);
        };
        this.clone = () => new ESNumber(this.valueOf());
    }
}
export class ESString extends ESPrimitive {
    constructor(value = '') {
        super(value, types.string);
        this.str = () => this;
        this.__add__ = (n) => {
            if (!(n instanceof ESString))
                return new TypeError(Position.unknown, 'String', n.typeOf().valueOf(), n.valueOf());
            return new ESString(this.valueOf() + n.valueOf());
        };
        this.__multiply__ = (n) => {
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
            return new ESString(this.valueOf().repeat(n.valueOf()));
        };
        this.__eq__ = (n) => {
            if (!(n instanceof ESString))
                return new ESBoolean(false);
            return new ESBoolean(this.valueOf() === n.valueOf());
        };
        this.__gt__ = (n) => {
            if (!(n instanceof ESString))
                return new TypeError(Position.unknown, 'String', n.typeOf().valueOf(), n.valueOf());
            return new ESBoolean(this.valueOf().length > n.valueOf().length);
        };
        this.__lt__ = (n) => {
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
        this.clone = () => new ESString(this.valueOf());
        this.__getProperty__ = (key) => {
            const self = this;
            if (key instanceof ESString && self.hasOwnProperty(key.valueOf().toString()))
                return self[key.valueOf().toString()];
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
    __setProperty__(key, value) {
        if (!(key instanceof ESNumber))
            return;
        if (!(value instanceof ESString))
            value = ESPrimitive.wrap(value);
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
        this.str = () => new ESString('<Undefined>');
        this.__eq__ = (n) => new ESBoolean(n instanceof ESUndefined || typeof n === 'undefined' || typeof n.valueOf() === 'undefined');
        this.__bool__ = () => new ESBoolean(false);
        this.clone = () => new ESUndefined();
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
        this.str = () => new ESString(`<Error: ${this.valueOf().str}>`);
        this.__eq__ = (n) => new ESBoolean(n instanceof ESErrorPrimitive && this.valueOf().constructor === n.valueOf().constructor);
        this.__bool__ = () => new ESBoolean(true);
        this.clone = () => new ESErrorPrimitive(this.valueOf());
    }
}
export class ESFunction extends ESPrimitive {
    constructor(func = (() => { }), arguments_ = [], name = '(anonymous)', this_ = new ESObject(), returnType = types.any, closure = global) {
        super(func, types.function);
        this.clone = () => {
            return new ESFunction(this.__value__, this.arguments_, this.name, this.this_, this.returnType, this.__closure__);
        };
        // @ts-ignore
        this.valueOf = () => this;
        this.str = () => new ESString(`<Func: ${this.name}>`);
        this.__eq__ = (n) => {
            if (!(n instanceof ESFunction))
                return new ESBoolean(false);
            return new ESBoolean(this.__value__ === n.__value__);
        };
        this.__bool__ = () => new ESBoolean(true);
        this.__call__ = (params = []) => {
            var _b, _c, _d, _e, _f;
            // generate context
            const context = this.__closure__;
            const fn = this.__value__;
            if (fn instanceof Node) {
                // fn is the function root node
                const newContext = generateESFunctionCallContext(params, this, context);
                if (newContext instanceof ESError)
                    return newContext;
                let this_ = (_b = this.this_) !== null && _b !== void 0 ? _b : new ESObject();
                if (!(this_ instanceof ESObject))
                    return new TypeError(Position.unknown, 'object', typeof this_, this_, '\'this\' must be an object');
                let setRes = newContext.set('this', this_);
                if (setRes instanceof ESError)
                    return setRes;
                const res = fn.interpret(newContext);
                if (res.error)
                    return res.error;
                if (res.funcReturn !== undefined) {
                    res.val = res.funcReturn;
                    res.funcReturn = undefined;
                }
                if (!this.returnType.includesType((_d = (_c = res.val) === null || _c === void 0 ? void 0 : _c.__type__) !== null && _d !== void 0 ? _d : types.any))
                    return new TypeError(Position.unknown, this.returnType.__name__, ((_e = res.val) === null || _e === void 0 ? void 0 : _e.typeOf().valueOf()) || 'undefined', (_f = res.val) === null || _f === void 0 ? void 0 : _f.str().valueOf(), '(from function return)');
                if (res.val)
                    return res.val;
                else
                    return new ESUndefined();
            }
            else if (typeof fn === 'function') {
                for (let i = params.length; i < fn.length; i++)
                    params.push(new ESUndefined());
                const res = fn(...params);
                return ESPrimitive.wrap(res);
            }
            else
                return new TypeError(Position.unknown, 'function', typeof fn);
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
        var _b;
        return (_b = this.info.name) !== null && _b !== void 0 ? _b : '(anonymous)';
    }
    set name(v) {
        this.info.name = v;
    }
}
export class ESBoolean extends ESPrimitive {
    constructor(val = false) {
        super(!!val, types.bool);
        this.__eq__ = (n) => {
            if (!(n instanceof ESBoolean))
                return new TypeError(Position.unknown, 'Boolean', n.typeOf().str().valueOf(), n.valueOf());
            return new ESBoolean(this.valueOf() === n.valueOf());
        };
        this.__bool__ = () => this;
        this.__and__ = (n) => {
            return new ESBoolean(this.bool().valueOf() && n.bool().valueOf());
        };
        this.__or__ = (n) => {
            return new ESBoolean(this.bool().valueOf() || n.bool().valueOf());
        };
        this.str = () => new ESString(this.valueOf() ? 'true' : 'false');
        this.clone = () => new ESBoolean(this.valueOf());
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
        this.str = () => {
            let val = str(this.valueOf());
            // remove trailing new line
            if (val[val.length - 1] === '\n')
                val = val.substr(0, val.length - 1);
            return new ESString(`<ESObject ${val}>`);
        };
        this.__eq__ = (n) => {
            if (!(n instanceof ESObject))
                return new ESBoolean();
            return new ESBoolean(this.valueOf() === n.valueOf());
        };
        this.__bool__ = () => new ESBoolean(true);
        this.__getProperty__ = (key) => {
            const self = this;
            if (key instanceof ESString && this.valueOf().hasOwnProperty(key.valueOf()))
                return this.valueOf()[key.valueOf()];
            if (self.hasOwnProperty(key.valueOf()))
                return self[key.valueOf()];
            return new ESUndefined();
        };
        this.clone = () => {
            let obj = {};
            let toClone = this.valueOf();
            for (let key in toClone) {
                try {
                    obj[key] = toClone[key].clone();
                }
                catch (e) {
                    throw Error('Couldn\'t clone ' + str(toClone[key]));
                }
            }
            return new ESObject(obj);
        };
    }
    __setProperty__(key, value) {
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
        this.str = () => new ESString(str(this.valueOf()));
        this.__eq__ = (n) => {
            if (!(n instanceof ESArray))
                return new ESBoolean();
            return new ESBoolean(this.valueOf() === n.valueOf());
        };
        this.__bool__ = () => new ESBoolean(this.valueOf().length > 0);
        this.__getProperty__ = (key) => {
            var _b;
            const self = this;
            if (key instanceof ESString && self.hasOwnProperty(key.valueOf()))
                return self[key.valueOf()];
            if (!(key instanceof ESNumber))
                return new ESUndefined();
            let idx = key.valueOf();
            while (idx < 0)
                idx = this.valueOf().length + idx;
            if (idx < this.valueOf().length)
                return (_b = this.valueOf()[idx]) === null || _b === void 0 ? void 0 : _b.valueOf();
            return new ESUndefined();
        };
        // Util
        /**
         * Uses JS Array.prototype.splice
         * @param val value to insert
         * @param idx index to insert at, defaults to end of array
         */
        this.add = (val, idx = new ESNumber(this.len - 1)) => {
            this.len++;
            this.__value__.splice(idx.valueOf(), 0, val);
            return new ESNumber(this.len);
        };
        /**
         * Uses JS Array.prototype.includes
         * @param val value to check for
         */
        this.contains = (val) => {
            for (let element of this.__value__)
                if (val.valueOf() == element.valueOf())
                    return true;
            return false;
        };
        this.clone = () => new ESArray(this.valueOf().map(v => v.clone()));
        this.len = values.length;
    }
    __setProperty__(key, value) {
        if (!(key instanceof ESNumber))
            return;
        if (!(value instanceof ESPrimitive))
            value = ESPrimitive.wrap(value);
        let idx = key.valueOf();
        while (idx < 0)
            idx = this.valueOf().length + idx;
        this.__value__[idx] = value;
    }
}
export class ESNamespace extends ESPrimitive {
    constructor(name, value, mutable = false) {
        super(value, types.object);
        this.clone = () => {
            let obj = {};
            let toClone = this.valueOf();
            for (let key in toClone) {
                try {
                    obj[key] = toClone[key].clone();
                }
                catch (e) {
                    throw Error('Couldn\'t clone ' + str(toClone[key]));
                }
            }
            return new ESNamespace(this.name, obj);
        };
        this.str = () => {
            const keys = Object.keys(this.valueOf());
            return new ESString(`<Namespace ${str(this.name)}: ${keys.slice(0, 5)}${keys.length >= 5 ? '...' : ''}>`);
        };
        this.__eq__ = (n) => {
            return new ESBoolean(this === n);
        };
        this.__bool__ = () => new ESBoolean(true);
        this.__getProperty__ = (key) => {
            const self = this;
            if (key instanceof ESString && this.valueOf().hasOwnProperty(key.valueOf())) {
                const symbol = this.valueOf()[key.valueOf()];
                if (symbol.isAccessible)
                    return symbol.value;
            }
            if (self.hasOwnProperty(key.valueOf()))
                return ESPrimitive.wrap(self[key.valueOf()]);
            return new ESUndefined();
        };
        this.info.name = name.valueOf();
        this.mutable = mutable;
    }
    get name() {
        return new ESString(this.info.name);
    }
    set name(v) {
        this.info.name = v.valueOf();
    }
    __setProperty__(key, value) {
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
types['type'] = new ESType(true, 'Type');
types['undefined'] = new ESType(true, 'Undefined');
types['string'] = new ESType(true, 'String');
types['array'] = new ESType(true, 'Array');
types['number'] = new ESType(true, 'Number');
types['any'] = new ESType(true, 'Any');
types['function'] = new ESType(true, 'Function');
types['bool'] = new ESType(true, 'Boolean');
types['object'] = new ESType(true, 'Object');
types['error'] = new ESType(true, 'Error');
// Documentation for types
types.any.info = {
    name: 'any',
    description: 'Matches any other type',
    file: 'built-in',
    isBuiltIn: true
};
types.number.info = {
    name: 'any',
    description: 'The ES Number type. Is a a double-precision 64-bit binary format IEEE 754 value, like double in Java and c#',
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
