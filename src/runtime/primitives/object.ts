import { Error, IndexError, TypeError } from '../../errors';
import { IFuncProps, Map, Primitive, str } from '../../util/util';
import { ESArray } from './array';
import { ESBoolean } from './boolean';
import { ESNumber } from './number';
import { ESString } from './string';
import { ESPrimitive } from '../esprimitive';
import { ESNull } from './null';
import { strip, wrap } from '../wrapStrip';
import { types } from "../../util/constants";
import { Iterable } from "./iterable";
import { ESTypeIntersection } from "./intersection";
import { ESTypeUnion } from "./type";

export class ESObject extends ESPrimitive <Map<Primitive>> implements Iterable{
    override __iterable__ = true;

    __type_map__: Map<Primitive> | undefined;

    constructor (val: Map<Primitive> = {}) {
        super(val, types.object);
    }

    override cast = (props: IFuncProps, type: Primitive) => {
        switch (type) {
            case types.number:
                return new ESNumber(this.__value__ ? 1 : 0);
            default:
                return new Error('TypeError', `Cannot cast boolean to type '${str(type.__type_name__())}'`);
        }
    }

    override str = (props: IFuncProps, depth = new ESNumber) => {
        let val = str(this.__value__, depth.__value__);
        // remove trailing new line
        if (val[val.length-1] === '\n') {
            val = val.substr(0, val.length-1);
        }
        return new ESString(val);
    }

    override keys = () => {
        return Object.keys(this.__value__).map(s => new ESString(s));
    }

    override __eq__ = (props: IFuncProps, n: Primitive): ESBoolean | Error => {
        if (!(n instanceof ESObject)) {
            return new ESBoolean();
        }

        if (n.keys().length !== this.keys().length) {
            return new ESBoolean();
        }

        for (const k of this.keys()) {
            const key: string = k.__value__;
            const thisElement = this.__value__[key];
            const nElement = n.__value__[key];

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

            const res = thisElement.__eq__(props, nElement);
            if (res instanceof Error) {
                return res;
            }
            if (!res.__value__) {
                return new ESBoolean();
            }
        }

        return new ESBoolean(true);
    };

    override __bool__ = () => new ESBoolean(true);
    override bool = this.__bool__;

    override __add__ = (props: IFuncProps, n: Primitive) => {

        if (!(n instanceof ESObject)) {
            return new TypeError('Object', n.__type_name__(), str(n));
        }

        const newOb: Map<Primitive> = {};

        for (const k of this.keys()) {
            const key = k.__value__;
            // skip keys which will be generated on the new object anyway
            if (key in this) continue;
            const res = this.__get__(props, k);
            if (res instanceof Error) {
                return res;
            }
            newOb[key] = res;
        }

        for (const k of n.keys()) {
            const key = k.__value__;
            if (key in newOb) continue;
            const res = n.__get__(props, k);
            if (res instanceof Error) {
                return res;
            }
            newOb[key] = res;
        }

        const res = new ESObject(newOb);
        // join type maps as well as objects
        res.__type_map__ = {
            ...this.__type_map__,
            ...n.__type_map__
        };
        return res;
    };

    override __subtract__ = (props: IFuncProps, n: Primitive): Primitive | Error => {

        let keysToRemove = [];
        if (n instanceof ESString) {
            keysToRemove = [str(n)];
        } else if (n instanceof ESArray) {
            keysToRemove = strip(n, props);
        } else {
            return new TypeError('Array | String', n.__type_name__(), str(n));
        }

        if (!Array.isArray(keysToRemove)) {
            return new TypeError('Array | String', n.__type_name__(), str(n));
        }

        const newOb: Map<Primitive> = {};

        for (const k of this.keys()) {
            const key = k.__value__;
            if (keysToRemove.indexOf(key) === -1) {
                const res = this.__get__(props, k);
                if (res instanceof Error) {
                    return res;
                }
                newOb[key] = res;
            }
        }

        return new ESObject(newOb);
    }

    override __get__ = (props: IFuncProps, k: Primitive): Primitive| Error => {
        if (!(k instanceof ESString) && !(k instanceof ESNumber)) {
            return new TypeError('String | ESNumber', k.__type_name__(), str(k));
        }

        const key: string | number = k.__value__;

        if (key in this.__value__) {
            return this.__value__[key];
        }

        if (key in this) {
            return wrap(this._[str(key)], true);
        }

        return new IndexError(str(key), this);
    };

    override __set__ = (props: IFuncProps, key: Primitive, value: Primitive): void | Error => {
        if (!(key instanceof ESString)) {
            return new TypeError('String', key.__type_name__(), str(key));
        }
        this.__value__[key.__value__] = value;
    }

    override has_property = (props: IFuncProps, k: Primitive): ESBoolean => {
        if (!(k instanceof ESString) && !(k instanceof ESNumber)) {
            return new ESBoolean();
        }
        if (k.__value__ in this.__value__) {
            return new ESBoolean(true);
        }

        return new ESBoolean(k.__value__ in this);
    };

    override clone = (): ESObject => {

        const res = new ESObject();
        const obj: Map<Primitive> = {};
        const toClone = this.__value__;

        for (const key of Object.keys(toClone)) {
            obj[key] = toClone[key];
        }

        res.__value__ = obj;

        return res;
    }

    override __includes__ = (props: IFuncProps, n: Primitive): ESBoolean | Error => {
        if (!(n instanceof ESObject)) {
            return new ESBoolean();
        }

        if (Object.keys(this.__value__).length < Object.keys(n.__value__).length) {
            return new ESBoolean();
        }

        for (const key of Object.keys(this.__value__)) {
            const thisType = this.__value__[key] ?? new ESNull();
            const nValue = n.__value__[key] ?? new ESNull();

            const typeCheckRes = thisType.__includes__(props, nValue);
            if (typeCheckRes instanceof Error) return typeCheckRes;
            if (!typeCheckRes.__value__) {
                return new ESBoolean();
            }
        }

        const cls: any = this.constructor;
        return new cls(true);
    };

    override __subtype_of__ = (props: IFuncProps, n: Primitive): ESBoolean | Error => {
        if (Object.is(n, types.any) || Object.is(n, types.object)) {
            return new ESBoolean(true);
        }
        if (!(n instanceof ESObject)) {
            return new ESBoolean();
        }

        if (Object.keys(this.__value__).length < Object.keys(n.__value__).length) {
            return new ESBoolean();
        }

        for (const key of Object.keys(this.__value__)) {
            const thisType = this.__value__[key] ?? new ESNull();
            const nValue = n.__value__[key] ?? new ESNull();

            const typeCheckRes = thisType.__subtype_of__(props, nValue);
            if (typeCheckRes instanceof Error) return typeCheckRes;
            if (!typeCheckRes.__value__) {
                return new ESBoolean();
            }
        }

        const cls: any = this.constructor;
        return new cls(true);
    };

    override __pipe__ = (props: IFuncProps, n: Primitive): Primitive | Error => {
        return new ESTypeUnion(this, n);
    }
    override __ampersand__ = (props: IFuncProps, n: Primitive): Primitive | Error => {
        return new ESTypeIntersection(this, n);
    }

    override __iter__ = (): Error | Primitive => {
        // returns array of keys in the object
        return new ESArray(Object.keys(this.__value__).map(s => new ESString(s)));
    }

    len = () => {
        return new ESNumber(Object.keys(this.__value__).length);
    }
}

