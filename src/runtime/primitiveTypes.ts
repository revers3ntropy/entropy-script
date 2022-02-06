import { global } from "../constants.js";
import {BuiltInFunction, dict, str} from '../util/util.js';
import { ESError, TypeError } from "../errors.js";
import { Position } from "../position.js";
import { Node } from "./nodes.js";
import { runtimeArgument } from "./argument.js";
import { Context, ESSymbol } from "./context.js";
import { createInstance } from "./instantiator.js";
import { call } from "./functionCaller.js";

export type typeName = 'Undefined' | 'String' | 'Array' | 'Number' | 'Any' | 'Function' | 'Boolean' | 'Type' | 'Object' | string;
export type Primitive = ESPrimitive<any> | ESString | ESType | ESNumber | ESUndefined | ESBoolean | ESArray | ESObject | ESFunction | ESErrorPrimitive;

export type Info = PrimitiveInfo & FunctionInfo & ObjectInfo;
export interface PrimitiveInfo {
    name?: string;
    description?: string;
    file?: string;
    helpLink?: string;
    isBuiltIn?: boolean;
}
export interface argInfo {
    name?: string;
    type?: string;
    description?: string;
    required?: boolean;
    defaultValue?: string;
}
export interface FunctionInfo extends PrimitiveInfo {
    args?: argInfo[];
    returns?: string;
    returnType?: string;
}
export interface ObjectInfo extends PrimitiveInfo {
    contents?: Info[];
}


// Optional Operator Methods
export interface ESPrimitive <T> {
    // Arithmetic
    __add__?(props: {context: Context}, n: Primitive): Primitive | ESError;
    __subtract__?(props: {context: Context}, n: Primitive): Primitive | ESError;
    __multiply__?(props: {context: Context}, n: Primitive): Primitive | ESError;
    __divide__?(props: {context: Context}, n: Primitive): Primitive | ESError;
    __pow__?(props: {context: Context}, n: Primitive): Primitive | ESError;

    // Boolean Logic
    __eq__?(props: {context: Context}, n: Primitive): ESBoolean | ESError;
    __gt__?(props: {context: Context}, n: Primitive): ESBoolean | ESError;
    __lt__?(props: {context: Context}, n: Primitive): ESBoolean | ESError;
    __and__?(props: {context: Context}, n: Primitive): ESBoolean | ESError;
    __or__?(props: {context: Context}, n: Primitive): ESBoolean | ESError;
    __bool__?(props: {context: Context}): ESBoolean | ESError;

    // Other
    __setProperty__?(props: {context: Context}, key: Primitive, value: Primitive): void | ESError;
    __getProperty__: (props: {context: Context}, key: Primitive) => Primitive;
    __call__?(props: {context: Context}, ...parameters: Primitive[]): ESError | Primitive;
}

export abstract class ESPrimitive <T> {
    public __value__: T;
    public __type__: ESType;
    public info: Info;
    protected self: any = this;

    /**
     * @param value
     * @param {ESType|false} type can ONLY be false for initialising the '__type__' ESType
     * @protected
     */
    protected constructor (value: T, type: ESType | false = types.any) {
        // @ts-ignore
        this.__type__ = type || this;
        this.__value__ = value;
        this.info = {};
    }

    // casting
    /**
     * cast to string
     * @returns {ESString} this cast to string
     */
    public abstract str: () => ESString;
    /**
     * Casts to a type
     * @type {(config: {context: Context}, type: Primitive) => Primitive}
     */
    public abstract cast: (config: {context: Context}, type: Primitive) => Primitive | ESError;


    /**
     * @param {Primitive[]} chain for solving circular objects. First element is object originally cloned
     * @returns {Primitive} deep clone of this
     */
    public abstract clone: (chain: Primitive[]) => Primitive;

    /**
     * Returns if this type is a subset of the type passed
     */
    public abstract isa: (config: {context: Context}, type: Primitive) => ESBoolean | ESError;

    /**
     * @returns {boolean} this cast to a boolean. Uses __bool__ if method exists.
     */
    public bool = (): ESBoolean => {
        if (this.hasOwnProperty('__bool__'))
            // @ts-ignore
            return this['__bool__']();

        return new ESBoolean(!!this.__value__);
    }

    // getters for private props
    public valueOf = (): T => this.__value__;
    public typeOf = (): ESString => new ESString(this.__type__.__name__);

    // Object stuff
    public hasProperty = ({}: {context: Context}, key: ESString): boolean => this.hasOwnProperty(key.valueOf());
    public __getProperty__ = ({}: {context: Context}, key: Primitive): Primitive => {
        if (this.self.hasOwnProperty(key.valueOf()))
            return ESPrimitive.wrap(this.self[key.valueOf()]);
        return ESPrimitive.wrap(new ESUndefined());
    };

    public static wrap (thing: any = undefined): Primitive {
        if (thing instanceof ESPrimitive)
            return thing;

        if (thing === undefined || thing === null)
            return new ESUndefined();

        if (thing instanceof ESError)
            return new ESErrorPrimitive(thing);
        if (thing instanceof ESSymbol)
            return thing.value;

        if (typeof thing == 'function')
            return new ESFunction(
                (p, ...args: Primitive[]) => {
                    const res = thing(p, ...args);
                    if (res instanceof ESError || res instanceof ESPrimitive)
                        return res;
                    ESPrimitive.wrap(res);
                }
            );
        if (typeof thing === 'number')
            return new ESNumber(thing);
        if (typeof thing === 'string')
            return new ESString(thing);
        if (typeof thing === 'boolean')
            return new ESBoolean(thing);
        if (typeof thing === 'object') {
            if (Array.isArray(thing))
                return new ESArray(thing.map(s => ESPrimitive.wrap(s)));

            let newObj: {[s: string]: Primitive} = {};
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
    public static strip (thing: Primitive | undefined): any {
        if (!thing) return undefined;
        if (!(thing instanceof ESPrimitive))
            return thing;

        if (thing instanceof ESArray)
            return thing.valueOf().map(m => ESPrimitive.strip(m));
        if (thing instanceof ESObject) {
            let val: any = {};
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

export class ESType extends ESPrimitive<undefined> {
    readonly __isPrimitive__: boolean;
    readonly __name__: typeName;
    readonly __extends__: undefined | ESType;
    readonly __methods__: ESFunction[];
    readonly __init__: ESFunction | undefined;
    readonly __instances__: ESObject[] = [];

    constructor (
        isPrimitive: boolean = false,
        name: typeName = '(anon)',
        __methods__: ESFunction[] = [],
        __extends__?: undefined | ESType,
        __init__?: undefined | ESFunction
    ) {
        super(undefined, types?.type);

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

    clone = (chain: Primitive[]) => {
        return new ESType(
            this.__isPrimitive__,
            this.__name__,
            this.__methods__.map(f => f.clone(chain)),
            this.__extends__,
            this.__init__?.clone(chain)
        )
    }

    isa = ({}, type: Primitive) => {
        return new ESBoolean(type === types.type);
    }

    cast = ({}, type: Primitive) => {
        return this;
    }

    includesType = ({context}: {context: Context}, t: ESType): ESBoolean => {
        if (
            this.equals({context}, types.any).valueOf() === true ||
            t.equals({context}, types.any).valueOf() === true ||

            (this.__extends__?.equals({context}, t).valueOf() === true) ||
            (this.__extends__?.equals({context}, types.any).valueOf() === true) ||
            (this.__extends__?.includesType({context}, t).valueOf() === true) ||

            (t.__extends__?.equals({context}, this).valueOf() === true) ||
            (t.__extends__?.equals({context}, types.any).valueOf() === true) ||
            (t.__extends__?.includesType({context}, this).valueOf() === true)
        ) {
            return new ESBoolean(true);
        }

        return this.equals({context}, t);
    }

    equals = ({}: {context: Context}, t: ESType): ESBoolean => {
        return new ESBoolean(
            t.__name__ === this.__name__ &&
            t.__isPrimitive__ === this.__isPrimitive__ &&
            Object.is(this.valueOf(), t.valueOf())
        );
    }

    __call__ = ({ context }: {context: Context}, ...params: Primitive[]): ESError | Primitive => {
        return createInstance(this, {context}, params || []);
    }

    str = () => new ESString(`<Type: ${this.__name__}>`);
}

export class ESNumber extends ESPrimitive <number> {
    constructor (value: number = 0) {
        super(value, types.number);
    }

    isa = ({}, type: Primitive) => {
        return new ESBoolean(type === types.number);
    }

    cast = ({}, type: Primitive): Primitive | ESError => {
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
    }

    str = () => new ESString(this.valueOf().toString());

    __add__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
        return new ESNumber(this.valueOf() + n.valueOf());
    };
    __subtract__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
        return new ESNumber(this.valueOf() - n.valueOf());
    };
    __multiply__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
        return new ESNumber(this.valueOf() * n.valueOf());
    };
    __divide__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
        return new ESNumber(this.valueOf() / n.valueOf());
    };
    __pow__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
        return new ESNumber(this.valueOf() ** n.valueOf());
    };
    __eq__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESNumber))
            return new ESBoolean(false);
        return new ESBoolean(this.valueOf() === n.valueOf());
    };
    __gt__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
        return new ESBoolean(this.valueOf() > n.valueOf());
    };
    __lt__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
        return new ESBoolean(this.valueOf() < n.valueOf());
    };
    __bool__ = () => {
        return new ESBoolean(this.valueOf() > 0);
    }
    clone = (chain: Primitive[]): ESNumber => new ESNumber(this.valueOf());
}

export class ESString extends ESPrimitive <string> {
    constructor (value: string = '') {
        super(value, types.string);
    }

    str = () => this;

    isa = ({}, type: Primitive) => {
        return new ESBoolean(type === types.string);
    }

    cast = ({}, type: Primitive): Primitive | ESError => {
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
    }

    __add__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESString))
            return new TypeError(Position.unknown, 'String', n.typeOf().valueOf(), n.valueOf());
        return new ESString(this.valueOf() + n.valueOf());
    };
    __multiply__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'Number', n.typeOf().valueOf(), n.valueOf());
        return new ESString(this.valueOf().repeat(n.valueOf()));
    };
    __eq__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESString))
            return new ESBoolean(false);
        return new ESBoolean(this.valueOf() === n.valueOf());
    };
    __gt__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESString))
            return new TypeError(Position.unknown, 'String', n.typeOf().valueOf(), n.valueOf());
        return new ESBoolean(this.valueOf().length > n.valueOf().length);
    };
    __lt__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESString))
            return new TypeError(Position.unknown, 'String', n.typeOf().valueOf(), n.valueOf());
        return new ESBoolean(this.valueOf().length < n.valueOf().length);
    };
    __bool__ = () => {
        return new ESBoolean(this.valueOf().length > 0);
    }

    len = () => {
        return new ESNumber(this.valueOf().length);
    }
    clone = (chain: Primitive[]): ESString => new ESString(this.valueOf());

    __getProperty__ = ({}: {context: Context}, key: Primitive): Primitive => {
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

    __setProperty__({}: {context: Context}, key: Primitive, value: Primitive): void {
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

export class ESUndefined extends ESPrimitive <undefined> {
    constructor () {
        super(undefined, types.undefined);

        // define the same info for every instance
        this.info = {
            name: 'undefined',
            description: 'Not defined, not a value.',
            file: 'built-in',
            isBuiltIn: true
        };
    }

    isa = ({}, type: Primitive) => {
        return new ESBoolean(type === types.string);
    }

    cast = ({context}: {context: Context}, type: Primitive) => {
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
                return new ESFunction(() => {});
            case types.boolean:
                return new ESBoolean();
            default:
                if (!(type instanceof ESType))
                    return new ESError(Position.unknown, 'TypeError', `Cannot cast to type '${str(type.typeOf())}'`);
                return type.__call__({context});
        }
    }

    str = () => new ESString('<Undefined>');

    __eq__ = ({}: {context: Context}, n: Primitive) => new ESBoolean(n instanceof ESUndefined || typeof n === 'undefined' || typeof n.valueOf() === 'undefined');
    __bool__ = () => new ESBoolean(false);
    clone = (chain: Primitive[]): ESUndefined => new ESUndefined();
}

export class ESErrorPrimitive extends ESPrimitive <ESError> {
    constructor (error: ESError = new ESError(Position.unknown, 'Unknown', 'error type not specified')) {
        super(error, types.error);
    }

    isa = ({}, type: Primitive) => {
        return new ESBoolean(type === types.error);
    }

    cast = ({}) => {
        return new ESError(Position.unknown, 'TypeError', `Cannot cast type 'error'`);
    }

    str = () => new ESString(`<Error: ${this.valueOf().str}>`);

    __eq__ = ({}: {context: Context}, n: Primitive) => new ESBoolean(n instanceof ESErrorPrimitive && this.valueOf().constructor === n.valueOf().constructor);
    __bool__ = () => new ESBoolean(true);
    clone = (chain: Primitive[]): ESErrorPrimitive => new ESErrorPrimitive(this.valueOf());
}

export class ESFunction extends ESPrimitive <Node | BuiltInFunction> {
    arguments_: runtimeArgument[];
    this_: ESObject;
    returnType: ESType;
    __closure__: Context;
    constructor (
        func: Node | BuiltInFunction = (() => {}),
        arguments_: runtimeArgument[] = [],
        name='(anonymous)',
        this_: ESObject = new ESObject(),
        returnType = types.any,
        closure = global
    ) {
        super(func, types.function);
        this.arguments_ = arguments_;
        this.info.name = name;
        this.this_ = this_;
        this.returnType = returnType;
        this.__closure__ = closure ?? new Context();

        this.info.returnType = str(returnType);
        this.info.args = arguments_.map(arg => ({
            name: arg.name,
            defaultValue: str(arg.defaultValue),
            type: arg.type.info.name,
            required: true
        }));
        // TODO: info.helpLink
    }

    isa = ({}, type: Primitive) => {
        return new ESBoolean(type === types.function);
    }

    cast = ({}, type: Primitive) => {
        return new ESError(Position.unknown, 'TypeError', `Cannot cast type 'function'`)
    }

    get name () {
        return this.info.name ?? '(anonymous)';
    }

    set name (v: string) {
        this.info.name = v;
    }

    clone = (chain: Primitive[]): ESFunction => {
        return new ESFunction(
            this.__value__,
            this.arguments_,
            this.name,
            this.this_,
            this.returnType,
            this.__closure__
        );
    };

    // @ts-ignore
    valueOf = () => this;

    str = () => new ESString(`<Func: ${this.name}>`);

    __eq__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESFunction))
            return new ESBoolean(false);
        return new ESBoolean(this.__value__ === n.__value__);
    };
    __bool__ = () => new ESBoolean(true);
    
    __call__ = ({context}: {context: Context}, ...params: Primitive[]): ESError | Primitive => {
        return call(context, this, params);
    }
}

export class ESBoolean extends ESPrimitive <boolean> {
    constructor (val: boolean = false) {
        super(Boolean(val), types.bool);

        this.info = {
            name: str(val),
            description: `Boolean global constant which evaluates to ${str(val)}, the opposite of ${str(!val)}`,
            file: 'built-in',
            isBuiltIn: true,
            helpLink: 'https://en.wikipedia.org/wiki/Boolean_expression'
        };
    }

    isa = ({}, type: Primitive) => {
        return new ESBoolean(type === types.string);
    }

    cast = ({}, type: Primitive) => {
        switch (type) {
            case types.number:
                return new ESNumber(this.valueOf() ? 1 : 0);
            default:
                return new ESError(Position.unknown, 'TypeError', `Cannot cast boolean to type '${str(type.typeOf())}'`);
        }
    }

    __eq__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESBoolean))
            return new TypeError(Position.unknown, 'Boolean', n.typeOf().str().valueOf(), n.valueOf())
        return new ESBoolean(this.valueOf() === n.valueOf());
    };
    __bool__ = () => this;

    __and__ = ({}: {context: Context}, n: Primitive) => {
        return new ESBoolean(this.bool().valueOf() && n.bool().valueOf());
    };

    __or__ = ({}: {context: Context}, n: Primitive) => {
        return new ESBoolean(this.bool().valueOf() || n.bool().valueOf());
    };

    str = () => new ESString(this.valueOf() ? 'true' : 'false');
    clone = (chain: Primitive[]): ESBoolean => new ESBoolean(this.valueOf());
}

export class ESObject extends ESPrimitive <dict<Primitive>> {
    constructor (val: dict<Primitive> = {}) {
        super(val, types.object);
    }

    isa = ({context}: {context: Context}, type: Primitive) => {
        if (type === types.object)
            return new ESBoolean(true);
        if (!(type instanceof ESType))
            return new TypeError(Position.unknown, 'TypeError', 'type', str(type.typeOf()), str(type));
        return this.__type__.includesType({context}, type);
    }

    cast = ({}, type: Primitive) => {
        switch (type) {
            case types.number:
                return new ESNumber(this.valueOf() ? 1 : 0);
            default:
                return new ESError(Position.unknown, 'TypeError', `Cannot cast boolean to type '${str(type.typeOf())}'`);
        }
    }

    str = () => {
        let val = str(this.valueOf());
        // remove trailing new line
        if (val[val.length-1] === '\n')
            val = val.substr(0, val.length-1);
        return new ESString(`<ESObject ${val}>`);
    }

    __eq__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESObject))
            return new ESBoolean();
        return new ESBoolean(this.valueOf() === n.valueOf());
    };
    __bool__ = () => new ESBoolean(true);

    __getProperty__ = ({}: {context: Context}, key: Primitive): Primitive => {
        if (key instanceof ESString && this.valueOf().hasOwnProperty(key.valueOf()))
            return this.valueOf()[key.valueOf()];

        if (this.self.hasOwnProperty(key.valueOf()))
            return ESPrimitive.wrap(this.self[key.valueOf()]);

        return new ESUndefined();
    };

    __setProperty__({}: {context: Context}, key: Primitive, value: Primitive): void | ESError {
        if (!(key instanceof ESString))
            return;
        if (!(value instanceof ESPrimitive))
            value = ESPrimitive.wrap(value);
        this.__value__[key.valueOf()] = value;
    }

    clone = (chain: Primitive[]): ESObject => {
        let obj: dict<Primitive> = {};
        let toClone = this.valueOf();
        for (let key in toClone) {
            try {
                obj[key] = toClone[key].clone(chain);
            } catch (e) {
                throw Error(`Couldn't clone ${str(toClone[key])} from ${this.info}`);
            }
        }
        return new ESObject(obj);
    }
}

export class ESArray extends ESPrimitive <Primitive[]> {
    len: number;

    constructor(values: Primitive[] = []) {
        super(values, types.array);
        this.len = values.length;
    }

    isa = ({}, type: Primitive) => {
        return new ESBoolean(type === types.array);
    }

    cast = ({}, type: Primitive) => {
        switch (type) {
            case types.number:
                return new ESNumber(this.len);
            case types.boolean:
                return this.bool();
            default:
                return new ESError(Position.unknown, 'TypeError', `Cannot cast boolean to type '${str(type.typeOf())}'`);
        }
    }

    str = () => new ESString(str(this.valueOf()));

    __eq__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESArray))
            return new ESBoolean();
        return new ESBoolean(this.valueOf() === n.valueOf());
    };
    __bool__ = () => new ESBoolean(this.valueOf().length > 0);

    __getProperty__ = ({}: {context: Context}, key: Primitive): Primitive => {
        if (key instanceof ESString && this.self.hasOwnProperty(<string>key.valueOf()))
            return ESPrimitive.wrap(this.self[key.valueOf()]);

        if (!(key instanceof ESNumber))
            return new ESUndefined();

        let idx = key.valueOf();

        while (idx < 0)
            idx = this.valueOf().length + idx;

        if (idx < this.valueOf().length)
            return this.valueOf()[idx];

        return new ESUndefined();
    };

    __setProperty__({}: {context: Context}, key: Primitive, value: Primitive): void {
        if (!(key instanceof ESNumber))
            return;

        if (!(value instanceof ESPrimitive))
            value = ESPrimitive.wrap(value);

        let idx = key.valueOf();

        while (idx < 0)
            idx = this.valueOf().length + idx;

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

    clone = (chain: Primitive[]): ESArray => {
        const newArr = [];
        for (let element of this.valueOf()) {
            newArr.push(element.clone(chain));
        }
        return new ESArray(newArr);
    }
}

export class ESNamespace extends ESPrimitive<dict<ESSymbol>> {
    public mutable: boolean;

    constructor (name: ESString, value: dict<ESSymbol>, mutable=false) {
        super(value, types.object);
        this.info.name = str(name);
        this.mutable = mutable;
    }

    isa = ({}, type: Primitive) => {
        return new ESBoolean(type === types.object);
    }

    cast = ({}) => {
        return new ESError(Position.unknown, 'TypeError', `Cannot cast type 'namespace'`);
    }

    get name () {
        return new ESString(this.info.name);
    }

    set name (v: ESString) {
        this.info.name = v.valueOf();
    }

    clone = (chain: Primitive[]): Primitive => {
        let obj: dict<ESSymbol> = {};
        let toClone = this.valueOf();
        for (let key in toClone) {
            obj[key] = toClone[key].clone();
        }
        return new ESNamespace(this.name, obj);
    }

    str = (): ESString => {
        const keys = Object.keys(this.valueOf());
        return new ESString(`<Namespace ${str(this.name)}: ${keys.slice(0, 5)}${keys.length >= 5 ? '...' : ''}>`);
    }

    __eq__ = ({}: {context: Context}, n: Primitive): ESBoolean => {
        return new ESBoolean(this === n);
    };
    __bool__ = () => new ESBoolean(true);

    __getProperty__ = ({}: {context: Context}, key: Primitive): Primitive => {
        if (key instanceof ESString && this.valueOf().hasOwnProperty(key.valueOf())) {
            const symbol = this.valueOf()[key.valueOf()];
            if (symbol.isAccessible)
                return symbol.value;
        }

        if (this.self.hasOwnProperty(key.valueOf()))
            return ESPrimitive.wrap(this.self[key.valueOf()]);

        return new ESUndefined();
    };

    __setProperty__({}: {context: Context}, key: Primitive, value: Primitive): void | ESError {
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

export let types: {[key: string] : ESType} = {};

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