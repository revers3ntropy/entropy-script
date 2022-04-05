import {Error, TypeError} from '../../errors';
import Position from '../../position';
import { funcProps, str } from '../../util/util';
import {ESArray} from './esarray';
import {ESBoolean} from './esboolean';
import {ESNumber} from './esnumber';
import {ESPrimitive} from '../esprimitive';
import type {Primitive} from '../primitive';
import {wrap} from '../wrapStrip';
import { types } from "../../util/constants";
import { ESTypeIntersection, ESTypeUnion } from "./estype";
import { ESIterable } from "./esiterable";

export class ESString extends ESPrimitive <string> implements ESIterable{

    override __iterable__ = true;

    constructor (value: string = '') {
        super(value, types.string);
    }

    override str = () => this;

    override cast = (props: funcProps, type: Primitive): Primitive | Error => {
        switch (type) {
            case types.number:
                const num = parseFloat(this.__value__);
                if (isNaN(num)) {
                    return new Error(Position.void, 'TypeError', `This string is not a valid number`);
                }
                return new ESNumber(num);
            case types.string:
                return this;
            case types.array:
                return new ESArray(this.__value__.split('').map(s => new ESString(s)));
            default:
                return new Error(Position.void, 'TypeError', `Cannot cast to type '${str(type.__type_name__())}'`);
        }
    }

    override __add__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESString)) {
            return new TypeError(Position.void, 'String', n.__type_name__(), n.__value__);
        }
        return new ESString(this.__value__ + n.__value__);
    };
    override __multiply__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESNumber)) {
            return new TypeError(Position.void, 'Number', n.__type_name__(), n.__value__);
        }
        return new ESString(this.__value__.repeat(n.__value__));
    };
    override __eq__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESString)) {
            return new ESBoolean(false);
        }
        return new ESBoolean(this.__value__ === n.__value__);
    };
    override __gt__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESString)) {
            return new TypeError(Position.void, 'String', n.__type_name__(), n.__value__);
        }
        return new ESBoolean(this.__value__.length > n.__value__.length);
    };
    override __lt__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESString)) {
            return new TypeError(Position.void, 'String', n.__type_name__(), n.__value__);
        }
        return new ESBoolean(this.__value__.length < n.__value__.length);
    };

    override __bool__ = () => new ESBoolean(this.__value__.length > 0);
    override bool = this.__bool__;


    len = () => {
        return new ESNumber(this.__value__.length);
    }

    override clone = () => new ESString(this.__value__);

    override __get__ = (props: funcProps, key: Primitive): Primitive => {
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

    override __set__ (props: funcProps, key: Primitive, value: Primitive): void {
        if (!(key instanceof ESNumber))
            return;

        if (!(value instanceof ESString))
            value = new ESString(str(value));

        let idx = key.__value__;

        while (idx < 0) {
            idx = this.__value__.length + idx;
        }

        const strToInsert = value.str(new ESNumber).__value__;

        let firstPart = this.__value__.substr(0, idx);
        let lastPart = this.__value__.substr(idx + strToInsert.length);

        this.__value__ = firstPart + strToInsert + lastPart;
    }

    override __includes__ = this.__eq__;

    override __pipe__ (props: funcProps, n: Primitive): Primitive | Error {
        return new ESTypeUnion(this, n);
    }
    override __ampersand__ (props: funcProps, n: Primitive): Primitive | Error {
        return new ESTypeIntersection(this, n);
    }

    override __iter__(props: funcProps): Error | Primitive {
        const chars = this.__value__.split('');
        return new ESArray(chars.map(s => new ESString(s)));
    }

    override keys = () => {
        let res: (ESNumber | ESString)[] = Object.keys(this._).map(s => new ESString(s));
        res.push(...Object.keys(this.__value__).map(s => new ESNumber(parseInt(s))))
        return res;
    }
}