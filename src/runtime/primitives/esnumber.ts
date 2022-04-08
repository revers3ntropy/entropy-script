import { Error, IndexError, TypeError } from '../../errors';
import {ESArray} from './esarray';
import {ESBoolean} from './esboolean';
import {ESString} from './esstring';
import {ESPrimitive} from '../esprimitive';
import { IFuncProps, str } from '../../util/util';
import type {Primitive} from '../primitive';
import { wrap } from "../wrapStrip";
import { types } from "../../util/constants";
import { ESTypeIntersection, ESTypeUnion } from "./estype";
import { ESIterable } from "./esiterable";

export class ESNumber extends ESPrimitive <number> implements ESIterable {
    override __iterable__ = true;

    constructor (value = 0) {
        super(value, types.number);
    }

    len = () => {
        return new ESNumber(this.__value__);
    };

    override cast = (props: IFuncProps, type: Primitive): Primitive | Error => {
        switch (type) {
            case types.number:
                return this;
            case types.string:
                return this.str();
            case types.array:
                return new ESArray(new Array(this.__value__));
            default:
                return new Error('TypeError', `Cannot cast to type '${str(type.__type_name__())}'`);
        }
    }

    override str = () => new ESString(this.__value__.toString());

    override __add__ = (props: IFuncProps, n: Primitive) => {
        if (!(n instanceof ESNumber)) {
            return new TypeError('Number', n.__type_name__(), n.__value__);
        }
        return new ESNumber(this.__value__ + n.__value__);
    };
    override __subtract__ = (props: IFuncProps, n: Primitive) => {
        if (!(n instanceof ESNumber)) {
            return new TypeError('Number', n.__type_name__(), n.__value__);
        }
        return new ESNumber(this.__value__ - n.__value__);
    };
    override __multiply__ = (props: IFuncProps, n: Primitive) => {
        if (!(n instanceof ESNumber)) {
            return new TypeError('Number', n.__type_name__(), n.__value__);
        }
        return new ESNumber(this.__value__ * n.__value__);
    };
    override __divide__ = (props: IFuncProps, n: Primitive) => {
        if (!(n instanceof ESNumber)) {
            return new TypeError('Number', n.__type_name__(), n.__value__);
        }
        return new ESNumber(this.__value__ / n.__value__);
    };
    override __pow__ = (props: IFuncProps, n: Primitive) => {
        if (!(n instanceof ESNumber)) {
            return new TypeError('Number', n.__type_name__(), n.__value__);
        }
        return new ESNumber(this.__value__ ** n.__value__);
    };
    override __mod__ = (props: IFuncProps, n: Primitive) => {
        if (!(n instanceof ESNumber)) {
            return new TypeError('Number', n.__type_name__(), n.__value__);
        }
        return new ESNumber(this.__value__ % n.__value__);
    };
    override __eq__ = (props: IFuncProps, n: Primitive) => {
        if (!(n instanceof ESNumber)) {
            return new ESBoolean(false);
        }
        return new ESBoolean(this.__value__ === n.__value__);
    };
    override __gt__ = (props: IFuncProps, n: Primitive) => {
        if (!(n instanceof ESNumber)) {
            return new TypeError('Number', n.__type_name__(), n.__value__);
        }
        return new ESBoolean(this.__value__ > n.__value__);
    };
    override __lt__ = (props: IFuncProps, n: Primitive) => {
        if (!(n instanceof ESNumber)) {
            return new TypeError('Number', n.__type_name__(), n.__value__);
        }
        return new ESBoolean(this.__value__ < n.__value__);
    };

    override __bool__ = () => {
        return new ESBoolean(this.__value__ > 0);
    }
    override bool = this.__bool__;

    override clone = (): ESNumber => new ESNumber(this.__value__);

    override __get__ = (props: IFuncProps, key: Primitive): Primitive | Error => {
        if (str(key) in this) {
            return wrap(this._[str(key)], true);
        }
        return new IndexError(key.__value__, this);
    };

    override __includes__ = this.__eq__;
    override __subtype_of__ = (props: IFuncProps, n: Primitive) => {
        if (Object.is(n, types.any) || Object.is(n, types.number)) {
            return new ESBoolean(true);
        }
        return this.__eq__(props, n);
    };

    override __pipe__ (props: IFuncProps, n: Primitive): Primitive | Error {
        return new ESTypeUnion(this, n);
    }
    override __ampersand__ (props: IFuncProps, n: Primitive): Primitive | Error {
        return new ESTypeIntersection(this, n);
    }

    override __iter__(props: IFuncProps): Error | Primitive {
        const arr: ESNumber[] = [];
        for (let i = 0; i < this.__value__; i++) {
            arr.push(new ESNumber(i));
        }
        return new ESArray(arr);
    }

    override keys = () => {
        return Object.keys(this).map(s => new ESString(s));
    }
}
