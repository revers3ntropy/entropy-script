import {Error, IndexError, TypeError} from '../../errors';
import type { Map, IFuncProps, Primitive } from '../../util/util';
import {ESSymbol} from '../symbol';
import {ESBoolean} from './boolean';
import {ESString} from './string';
import {ESPrimitive} from '../primitive';
import {wrap} from '../wrapStrip';
import { types } from "../../util/constants";
import { ESArray } from "./array";
import type { Iterable } from "./iterable";
import { ESNumber } from "./number";
import { ESTypeIntersection } from "./intersection";
import { ESTypeUnion } from "./type";
import { str } from "../../util/util";

export class Namespace extends ESPrimitive<Map<ESSymbol>> implements Iterable {
    public __mutable__: boolean;
    override __iterable__ = true;

    constructor (name: ESString, value: Map<ESSymbol>, mutable=false) {
        super(value, types.object);
        this.__info__.name = str(name);
        this.__mutable__ = mutable;
    }

    override cast = () => {
        return new Error('TypeError', `Cannot cast type 'namespace'`);
    }

    get name () {
        return new ESString(this.__info__.name);
    }

    set name (v: ESString) {
        this.__info__.name = v.__value__;
    }

    override clone = (): Primitive => {
        const obj: Map<ESSymbol> = {};
        const toClone = this.__value__;
        for (const key of Object.keys(toClone)) {
            obj[key] = toClone[key];
        }
        return new Namespace(this.name, obj);
    }

    override str = (): ESString => {
        const keys = Object.keys(this.__value__);
        return new ESString(`<Namespace ${str(this.name)}${keys.length > 0 ? ': ' : ''}${keys.slice(0, 5)}${keys.length >= 5 ? '...' : ''}>`);
    }

    override __eq__ = (props: IFuncProps, n: Primitive): ESBoolean => {
        return new ESBoolean(this === n);
    };

    override __bool__ = () => new ESBoolean(true);
    override bool = this.__bool__;


    override __get__ = (props: IFuncProps, key: Primitive): Primitive | Error => {
        if (key instanceof ESString && key.__value__ in this.__value__) {
            const symbol = this.__value__[key.__value__];
            if (symbol.isAccessible) {
                return symbol.value;
            }
        }

        if (!(key instanceof ESString)) {
            return new TypeError('string', key.__type_name__());
        }

        if (str(key) in this) {
            return wrap(this._[str(key)], true);
        }

        return new IndexError(key.__value__, this._);
    };

    override __set__ = (props: IFuncProps, key: Primitive, value: Primitive): void | Error => {
        if (!(key instanceof ESString)) {
            return new TypeError('string', key.__type_name__(), str(key));
        }

        const idx = str(key);

        if (!this.__mutable__) {
            return new TypeError('mutable', 'immutable', `${str(this.name)}`);
        }

        const symbol = this.__value__[idx];
        if (!symbol) {
            return new Error('SymbolError', `Symbol ${idx} is not declared in namespace ${str(this.name)}.`);
        }
        if (symbol.isConstant) {
            return new TypeError('mutable', 'immutable', `${str(this.name)}[${idx}]`);
        }
        if (!symbol.isAccessible) {
            return new TypeError('accessible', 'inaccessible', `${str(this.name)}[${idx}]`);
        }

        symbol.value = value;
    }

    override __includes__ = this.__eq__;
    override __subtype_of__ = (props: IFuncProps, n: Primitive) => {
        if (Object.is(n, types.any) || Object.is(n, types.object)) {
            return new ESBoolean(true);
        }
        return this.__eq__(props, n);
    };

    override __pipe__ = (props: IFuncProps, n: Primitive): Primitive | Error => {
        return new ESTypeUnion(this, n);
    }
    override __ampersand__ = (props: IFuncProps, n: Primitive): Primitive | Error => {
        return new ESTypeIntersection(this, n);
    }

    override __iter__ = (props: IFuncProps): Error | Primitive => {
        // returns array of keys in the object
        return new ESArray(Object.keys(this.__value__).map(s => new ESString(s)));
    }

    len = () => {
        return new ESNumber(Object.keys(this.__value__).length);
    }

    override keys = () => {
        return [
            ...Object.keys(this),
            ...Object.keys(this.__value__)
        ].map(s => new ESString(s));
    }

    contains = this.has_property;
}
