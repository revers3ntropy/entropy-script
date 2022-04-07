import { Error, IndexError, TypeError } from '../../errors';
import { dict, funcProps, str } from '../../util/util';
import {ESArray} from './esarray';
import {ESBoolean} from './esboolean';
import {ESNumber} from './esnumber';
import {ESString} from './esstring';
import {ESPrimitive} from '../esprimitive';
import {ESUndefined} from './esundefined';
import type { Primitive} from '../primitive';
import {strip, wrap} from '../wrapStrip';
import { types } from "../../util/constants";
import { ESTypeIntersection, ESTypeUnion } from "./estype";
import { ESIterable } from "./esiterable";

export class ESObject extends ESPrimitive <dict<Primitive>> implements ESIterable{
    override __iterable__ = true;

    __type_map__: dict<Primitive> | undefined;

    constructor (val: dict<Primitive> = {}) {
        super(val, types.object);
    }

    override cast = (props: funcProps, type: Primitive) => {
        switch (type) {
            case types.number:
                return new ESNumber(this.__value__ ? 1 : 0);
            default:
                return new Error('TypeError', `Cannot cast boolean to type '${str(type.__type_name__())}'`);
        }
    }

    override str = (depth = new ESNumber) => {
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

    override __eq__ = (props: funcProps, n: Primitive): ESBoolean | Error => {
        if (!(n instanceof ESObject)) {
            return new ESBoolean();
        }

        if (n.keys().length !== this.keys().length) {
            return new ESBoolean();
        }

        for (let k of this.keys()) {
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

    override __add__ = (props: funcProps, n: Primitive) => {

        if (!(n instanceof ESObject)) {
            return new TypeError('Object', n.__type_name__(), n);
        }

        let newOb: dict<Primitive> = {};

        for (let k of this.keys()) {
            const key = k.__value__;
            // skip keys which will be generated on the new object anyway
            if (this.hasOwnProperty(key)) continue;
            const res = this.__get__(props, k);
            if (res instanceof Error) {
                return res;
            }
            newOb[key] = res;
        }

        for (let k of n.keys()) {
            const key = k.__value__;
            if (newOb.hasOwnProperty(key)) continue;
            const res = n.__get__(props, k);
            if (res instanceof Error) {
                return res;
            }
            newOb[key] = res;
        }

        let res = new ESObject(newOb);
        // join type maps as well as objects
        res.__type_map__ = {
            ...this.__type_map__,
            ...n.__type_map__
        };
        return res;
    };

    override __subtract__ = (props: funcProps, n: Primitive): Primitive | Error => {

        let keysToRemove = [];
        if (n instanceof ESString) {
            keysToRemove = [str(n)];
        } else if (n instanceof ESArray) {
            keysToRemove = strip(n, props);
        } else {
            return new TypeError('Array | String', n.__type_name__(), n);
        }

        if (!Array.isArray(keysToRemove)) {
            return new TypeError('Array | String', n.__type_name__(), n);
        }

        let newOb: dict<Primitive> = {};

        for (let k of this.keys()) {
            const key = k.__value__;
            if (keysToRemove.indexOf(key) === -1) {
                let res = this.__get__(props, k);
                if (res instanceof Error) {
                    return res;
                }
                newOb[key] = res;
            }
        }

        return new ESObject(newOb);
    }

    override __get__ = (props: funcProps, k: Primitive): Primitive| Error => {
        if (!(k instanceof ESString) && !(k instanceof ESNumber)) {
            return new TypeError('String | Number', k.__type_name__(), str(k));
        }

        const key: string | number = k.__value__;

        if (this.__value__.hasOwnProperty(key)) {
            return this.__value__[key];
        }

        if (this._.hasOwnProperty(key)) {
            return wrap(this._[str(key)], true);
        }

        return new IndexError(str(key), this);
    };

    override __set__ = (props: funcProps, key: Primitive, value: Primitive): void | Error => {
        if (!(key instanceof ESString)) {
            return new TypeError('String', key.__type_name__(), str(key));
        }
        this.__value__[key.__value__] = value;
    }

    override has_property = (props: funcProps, k: Primitive): ESBoolean => {
        const key = str(k);
        if (this.__value__.hasOwnProperty(str(key))) {
            return new ESBoolean(true);
        }

        return new ESBoolean(this.hasOwnProperty(key));
    };

    override clone = (): ESObject => {

        const res = new ESObject();
        let obj: dict<Primitive> = {};
        let toClone = this.__value__;

        for (let key of Object.keys(toClone)) {
            obj[key] = toClone[key];
        }

        res.__value__ = obj;

        return res;
    }

    override __includes__ = (props: funcProps, n: Primitive): ESBoolean | Error => {
        if (!(n instanceof ESObject)) {
            return new ESBoolean();
        }

        if (Object.keys(this.__value__).length < Object.keys(n.__value__).length) {
            return new ESBoolean();
        }

        for (let key of Object.keys(this.__value__)) {
            const thisType = this.__value__[key] ?? new ESUndefined();
            const nValue = n.__value__[key] ?? new ESUndefined();

            let typeCheckRes = thisType.__includes__(props, nValue);
            if (typeCheckRes instanceof Error) return typeCheckRes;
            if (!typeCheckRes.__value__) {
                return new ESBoolean();
            }
        }

        let cls: any = this.constructor;
        return new cls(true);
    };

    override __subtype_of__ = (props: funcProps, n: Primitive): ESBoolean | Error => {
        if (Object.is(n, types.any) || Object.is(n, types.object)) {
            return new ESBoolean(true);
        }
        if (!(n instanceof ESObject)) {
            return new ESBoolean();
        }

        if (Object.keys(this.__value__).length < Object.keys(n.__value__).length) {
            return new ESBoolean();
        }

        for (let key of Object.keys(this.__value__)) {
            const thisType = this.__value__[key] ?? new ESUndefined();
            const nValue = n.__value__[key] ?? new ESUndefined();

            let typeCheckRes = thisType.__subtype_of__(props, nValue);
            if (typeCheckRes instanceof Error) return typeCheckRes;
            if (!typeCheckRes.__value__) {
                return new ESBoolean();
            }
        }

        let cls: any = this.constructor;
        return new cls(true);
    };

    override __pipe__ (props: funcProps, n: Primitive): Primitive | Error {
        return new ESTypeUnion(this, n);
    }
    override __ampersand__ (props: funcProps, n: Primitive): Primitive | Error {
        return new ESTypeIntersection(this, n);
    }

    override __iter__(props: funcProps): Error | Primitive {
        // returns array of keys in the object
        return new ESArray(Object.keys(this.__value__).map(s => new ESString(s)));
    }

    len = () => {
        return new ESNumber(Object.keys(this.__value__).length);
    }
}

export class ESInterface extends ESObject {
    override __includes__ = (props: funcProps, n: Primitive): ESBoolean | Error => {
        for (let key of Object.keys(this.__value__)) {
            const thisType = this.__value__[key];
            const nValue = n.__value__[key] ?? new ESUndefined();

            let typeCheckRes = thisType.__includes__(props, nValue);
            if (typeCheckRes instanceof Error) return typeCheckRes;
            if (!typeCheckRes.__value__) {
                return new ESBoolean();
            }
        }

        return new ESBoolean(true);
    };

    override __subtype_of__ = (props: funcProps, n: Primitive): ESBoolean | Error => {
        if (Object.is(n, types.any) || Object.is(n, types.object)) {
            return new ESBoolean(true);
        }
        if (!(n instanceof ESObject)) {
            return new ESBoolean();
        }

        for (let key of Object.keys(this.__value__)) {
            if (!n.__value__.hasOwnProperty(key)) {
                return new ESBoolean();
            }
            const thisType = this.__value__[key];
            const nValue = n.__value__[key];

            let typeCheckRes = thisType.__subtype_of__(props, nValue);
            if (typeCheckRes instanceof Error) return typeCheckRes;
            if (!typeCheckRes.__value__) {
                return new ESBoolean();
            }
        }

        return new ESBoolean(true);
    };

    override __set__ = (props: funcProps, key: Primitive): void | Error => {
        return new TypeError('Mutable', 'Immutable', str(key));
    }

    override str = (depth = new ESNumber) => {
        let val = str(this.__value__, depth.__value__);
        // remove trailing new line
        if (val[val.length-1] === '\n') {
            val = val.substr(0, val.length-1);
        }
        return new ESString('interface ' + val);
    }
}
