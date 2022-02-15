import { ESError, TypeError } from '../../errors.js';
import { Position } from '../../position.js';
import { ESArray } from './esarray.js';
import { ESBoolean } from './esboolean.js';
import { ESString } from './esstring.js';
import { ESPrimitive } from './esprimitive.js';
import { str } from '../../util/util.js';
import { types } from './primitive.js';
export class ESNumber extends ESPrimitive {
    constructor(value = 0) {
        super(value, types.number);
        this.isa = ({}, type) => {
            return new ESBoolean(type === types.number);
        };
        this.cast = ({}, type) => {
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
        };
        this.str = () => new ESString(this.valueOf().toString());
        this.__add__ = ({}, n) => {
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'Number', n.typeName().valueOf(), n.valueOf());
            return new ESNumber(this.valueOf() + n.valueOf());
        };
        this.__subtract__ = ({}, n) => {
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'Number', n.typeName().valueOf(), n.valueOf());
            return new ESNumber(this.valueOf() - n.valueOf());
        };
        this.__multiply__ = ({}, n) => {
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'Number', n.typeName().valueOf(), n.valueOf());
            return new ESNumber(this.valueOf() * n.valueOf());
        };
        this.__divide__ = ({}, n) => {
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'Number', n.typeName().valueOf(), n.valueOf());
            return new ESNumber(this.valueOf() / n.valueOf());
        };
        this.__pow__ = ({}, n) => {
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'Number', n.typeName().valueOf(), n.valueOf());
            return new ESNumber(Math.pow(this.valueOf(), n.valueOf()));
        };
        this.__eq__ = ({}, n) => {
            if (!(n instanceof ESNumber))
                return new ESBoolean(false);
            return new ESBoolean(this.valueOf() === n.valueOf());
        };
        this.__gt__ = ({}, n) => {
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'Number', n.typeName().valueOf(), n.valueOf());
            return new ESBoolean(this.valueOf() > n.valueOf());
        };
        this.__lt__ = ({}, n) => {
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'Number', n.typeName().valueOf(), n.valueOf());
            return new ESBoolean(this.valueOf() < n.valueOf());
        };
        this.__bool__ = () => {
            return new ESBoolean(this.valueOf() > 0);
        };
        this.bool = this.__bool__;
        this.clone = (chain) => new ESNumber(this.valueOf());
    }
}
