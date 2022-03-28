import { EndIterator, Error, IndexError, TypeError } from '../../errors';
import Position from '../../position';
import {ESArray} from './esarray';
import {ESBoolean} from './esboolean';
import {ESString} from './esstring';
import {ESPrimitive} from './esprimitive';
import { funcProps, str } from '../../util/util';
import type {Primitive} from './primitive';
import { wrap } from "./wrapStrip";
import { types } from "../../util/constants";
import { ESTypeIntersection, ESTypeUnion } from "./estype";
import { ESErrorPrimitive } from "./eserrorprimitive";

export class ESNumber extends ESPrimitive <number> {
    constructor (value: number = 0) {
        super(value, types.number);
    }

    override cast = (props: funcProps, type: Primitive): Primitive | Error => {
        switch (type) {
            case types.number:
                return this;
            case types.string:
                return this.str();
            case types.array:
                return new ESArray(new Array(this.valueOf()));
            default:
                return new Error(Position.void, 'TypeError', `Cannot cast to type '${str(type.__type_name__())}'`);
        }
    }

    override str = () => new ESString(this.valueOf().toString());

    override __add__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESNumber)) {
            return new TypeError(Position.void, 'Number', n.__type_name__().valueOf(), n.valueOf());
        }
        return new ESNumber(this.valueOf() + n.valueOf());
    };
    override __subtract__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESNumber)) {
            return new TypeError(Position.void, 'Number', n.__type_name__().valueOf(), n.valueOf());
        }
        return new ESNumber(this.valueOf() - n.valueOf());
    };
    override __multiply__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESNumber)) {
            return new TypeError(Position.void, 'Number', n.__type_name__().valueOf(), n.valueOf());
        }
        return new ESNumber(this.valueOf() * n.valueOf());
    };
    override __divide__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESNumber)) {
            return new TypeError(Position.void, 'Number', n.__type_name__().valueOf(), n.valueOf());
        }
        return new ESNumber(this.valueOf() / n.valueOf());
    };
    override __pow__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESNumber)) {
            return new TypeError(Position.void, 'Number', n.__type_name__().valueOf(), n.valueOf());
        }
        return new ESNumber(this.valueOf() ** n.valueOf());
    };
    override __mod__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESNumber)) {{
            return new TypeError(Position.void, 'Number', n.__type_name__().valueOf(), n.valueOf());
        }
        }
        return new ESNumber(this.valueOf() % n.valueOf());
    };
    override __eq__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESNumber)) {
            return new ESBoolean(false);
        }
        return new ESBoolean(this.valueOf() === n.valueOf());
    };
    override __gt__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESNumber)) {
            return new TypeError(Position.void, 'Number', n.__type_name__().valueOf(), n.valueOf());
        }
        return new ESBoolean(this.valueOf() > n.valueOf());
    };
    override __lt__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESNumber)) {
            return new TypeError(Position.void, 'Number', n.__type_name__().valueOf(), n.valueOf());
        }
        return new ESBoolean(this.valueOf() < n.valueOf());
    };

    override __bool__ = () => {
        return new ESBoolean(this.valueOf() > 0);
    }
    override bool = this.__bool__;

    override clone = (): ESNumber => new ESNumber(this.valueOf());

    override __get__ = ({}: funcProps, key: Primitive): Primitive | Error => {
        if (this._.hasOwnProperty(str(key))) {
            return wrap(this._[str(key)], true);
        }
        return new IndexError(Position.void, key.valueOf(), this);
    };

    override __includes__ = this.__eq__;

    override __pipe__ (props: funcProps, n: Primitive): Primitive | Error {
        return new ESTypeUnion(this, n);
    }
    override __ampersand__ (props: funcProps, n: Primitive): Primitive | Error {
        return new ESTypeIntersection(this, n);
    }

    override __iter__(props: funcProps): Error | Primitive {
        let arr: ESNumber[] = [];
        for (let i = 0; i < this.valueOf(); i++) {
            arr.push(new ESNumber(i));
        }
        return new ESArray(arr);
    }
}
