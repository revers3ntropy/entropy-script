import { ESError, IndexError, TypeError } from '../../errors.js';
import {Position} from '../../position.js';
import {Context} from '../context.js';
import {ESArray} from './esarray.js';
import {ESBoolean} from './esboolean.js';
import {ESString} from './esstring.js';
import {ESPrimitive} from './esprimitive.js';
import { funcProps, str } from '../../util/util.js';
import {Primitive, types} from './primitive.js';
import { ESFunction } from "./esfunction.js";
import { wrap } from "./wrapStrip.js";

export class ESNumber extends ESPrimitive <number> {
    constructor (value: number = 0) {
        super(value, types.number);
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
                return new ESError(Position.unknown, 'TypeError', `Cannot cast to type '${str(type.typeName())}'`);
        }
    }

    str = () => new ESString(this.valueOf().toString());

    __add__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'Number', n.typeName().valueOf(), n.valueOf());
        return new ESNumber(this.valueOf() + n.valueOf());
    };
    __subtract__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'Number', n.typeName().valueOf(), n.valueOf());
        return new ESNumber(this.valueOf() - n.valueOf());
    };
    __multiply__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'Number', n.typeName().valueOf(), n.valueOf());
        return new ESNumber(this.valueOf() * n.valueOf());
    };
    __divide__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'Number', n.typeName().valueOf(), n.valueOf());
        return new ESNumber(this.valueOf() / n.valueOf());
    };
    __pow__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'Number', n.typeName().valueOf(), n.valueOf());
        return new ESNumber(this.valueOf() ** n.valueOf());
    };
    __eq__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESNumber))
            return new ESBoolean(false);
        return new ESBoolean(this.valueOf() === n.valueOf());
    };
    __gt__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'Number', n.typeName().valueOf(), n.valueOf());
        return new ESBoolean(this.valueOf() > n.valueOf());
    };
    __lt__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'Number', n.typeName().valueOf(), n.valueOf());
        return new ESBoolean(this.valueOf() < n.valueOf());
    };

    __bool__ = () => {
        return new ESBoolean(this.valueOf() > 0);
    }
    bool = this.__bool__;

    clone = (): ESNumber => new ESNumber(this.valueOf());

    __getProperty__ = ({}: funcProps, key: Primitive): Primitive | ESError => {
        if (this.self.hasOwnProperty(str(key))) {
            const val = this.self[str(key)];
            if (typeof val === 'function') {
                return new ESFunction(val);
            }
            return wrap(val);
        }
        return new IndexError(Position.unknown, key.valueOf(), this);
    };
}
