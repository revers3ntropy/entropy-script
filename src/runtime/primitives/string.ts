import {Error, TypeError} from '../../errors';
import { IFuncProps, Primitive, str } from '../../util/util';
import {ESArray} from './array';
import {ESBoolean} from './boolean';
import {ESNumber} from './number';
import {ESPrimitive} from '../primitive';
import {wrap} from '../wrapStrip';
import { types } from "../../util/constants";
import { Iterable } from "./iterable";
import { ESTypeIntersection } from "./intersection";
import { ESTypeUnion } from "./type";

export class ESString extends ESPrimitive <string> implements Iterable {

    override __iterable__ = true;

    constructor (value = '') {
        super(value.toString(), types.string);
    }

    override str = () => this;

    override cast = (props: IFuncProps, type: Primitive): Primitive | Error => {
        switch (type) {
            case types.number:
                const num = parseFloat(this.__value__);
                if (isNaN(num)) {
                    return new Error('TypeError', `This string is not a valid number`);
                }
                return new ESNumber(num);
            case types.string:
                return this;
            case types.array:
                return new ESArray(this.__value__.split('').map(s => new ESString(s)));
            default:
                return new Error('TypeError', `Cannot cast to type '${str(type.__type_name__())}'`);
        }
    }

    override __add__ = (props: IFuncProps, n: Primitive) => {
        if (!(n instanceof ESString)) {
            return new TypeError('Str', n.__type_name__(), n.__value__);
        }
        return new ESString(this.__value__ + n.__value__);
    };
    override __multiply__ = (props: IFuncProps, n: Primitive) => {
        if (!(n instanceof ESNumber)) {
            return new TypeError('ESNumber', n.__type_name__(), n.__value__);
        }
        return new ESString(this.__value__.repeat(n.__value__));
    };
    override __eq__ = (props: IFuncProps, n: Primitive) => {
        if (!(n instanceof ESString)) {
            return new ESBoolean(false);
        }
        return new ESBoolean(this.__value__ === n.__value__);
    };
    override __gt__ = (props: IFuncProps, n: Primitive) => {
        if (!(n instanceof ESString)) {
            return new TypeError('Str', n.__type_name__(), n.__value__);
        }
        return new ESBoolean(this.__value__.length > n.__value__.length);
    };
    override __lt__ = (props: IFuncProps, n: Primitive) => {
        if (!(n instanceof ESString)) {
            return new TypeError('Str', n.__type_name__(), n.__value__);
        }
        return new ESBoolean(this.__value__.length < n.__value__.length);
    };

    override __bool__ = () => new ESBoolean(this.__value__.length > 0);
    override bool = this.__bool__;


    len = () => {
        return new ESNumber(this.__value__.length);
    }

    override clone = () => new ESString(this.__value__);

    override __get__ = (props: IFuncProps, key: Primitive): Primitive => {
        // eslint-disable-next-line no-prototype-builtins
        if (key instanceof ESString && this._.hasOwnProperty(str(key))) {
            return wrap(this._[str(key)], true);
        }

        if (!(key instanceof ESNumber)) {
            return new ESString();
        }

        let idx = key.__value__;

        while (idx < 0) {
            idx = this.__value__.length + idx;
        }

        if (idx < this.__value__.length) {
            return new ESString(this.__value__[idx]);
        }

        return new ESString();
    };

    override __set__ = (props: IFuncProps, key: Primitive | string, value: Primitive) => {
        if (!(key instanceof ESNumber)) {
            return;
        }

        if (!(value instanceof ESString)) {
            value = new ESString(str(value));
        }

        let idx = key.__value__;

        while (idx < 0) {
            idx = this.__value__.length + idx;
        }

        const strToInsert = value.str(props, new ESNumber).__value__;

        const firstPart = this.__value__.substr(0, idx);
        const lastPart = this.__value__.substr(idx + strToInsert.length);

        this.__value__ = firstPart + strToInsert + lastPart;
    }

    override __includes__ = this.__eq__;

    override __subtype_of__ = (props: IFuncProps, n: Primitive) => {
        if (Object.is(n, types.any) || Object.is(n, types.string)) {
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

    override __iter__ = (): Error | Primitive => {
        const chars = this.__value__.split('');
        return new ESArray(chars.map(s => new ESString(s)));
    }

    override keys = () => {
        const res: (ESNumber | ESString)[] = Object.keys(this._).map(s => new ESString(s));
        res.push(...Object.keys(this.__value__).map(s => new ESNumber(parseInt(s))))
        return res;
    }

    contains = (props: IFuncProps, n: Primitive) => {
        if (!(n instanceof ESString)) {
            return new TypeError('Str', n.__type_name__(), n.__value__);
        }
        return new ESBoolean(this.__value__.includes(n.__value__));
    }
}