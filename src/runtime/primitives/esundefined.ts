import { Error, IndexError } from '../../errors';
import Position from '../../position';
import {Context} from '../context';
import {ESArray} from './esarray';
import {ESBoolean} from './esboolean';
import {ESErrorPrimitive} from './eserrorprimitive';
import {ESFunction} from './esfunction';
import {ESNumber} from './esnumber';
import {ESObject} from './esobject';
import {ESString} from './esstring';
import { ESType, ESTypeIntersection, ESTypeUnion } from './estype';
import {ESPrimitive} from './esprimitive';
import {Primitive} from './primitive';
import { funcProps, str } from '../../util/util';
import { wrap } from "./wrapStrip";
import { types } from "../../util/constants";

export class ESUndefined extends ESPrimitive <undefined> {
    constructor () {
        super(undefined, types.undefined);

        // define the same info for every instance
        this.__info__ = {
            name: 'undefined',
            description: 'Not defined, not a value.',
            file: 'built-in',
            builtin: true
        };
    }

    override cast = ({context}: {context: Context}, type: Primitive): Primitive | Error => {
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
            if (!(type instanceof ESType)) {
                return new Error(Position.void, 'TypeError', `Cannot cast to type '${str(type.__type_name__())}'`);
            }
            return type.__call__({context});
        }
    }

    override str = () => new ESString('<Undefined>');

    override __eq__ = (props: funcProps, n: Primitive) => {
        return new ESBoolean(
            n instanceof ESUndefined ||
            typeof n === 'undefined' ||
            typeof n.__value__ === 'undefined'
        );
    }

    override __bool__ = () => new ESBoolean();
    override bool = this.__bool__;

    override clone = () => new ESUndefined();

    override __get__ = ({}: funcProps, key: Primitive): Primitive | Error => {
        if (this._.hasOwnProperty(str(key))) {
            return wrap(this._[str(key)], true);
        }
        return new IndexError(Position.void, key.__value__, this);
    };

    override __includes__ = this.__eq__;

    override __pipe__ (props: funcProps, n: Primitive): Primitive | Error {
        return new ESTypeUnion(this, n);
    }
    override __ampersand__ (props: funcProps, n: Primitive): Primitive | Error {
        return new ESTypeIntersection(this, n);
    }

    override keys = () => {
        return Object.keys(this).map(s => new ESString(s));
    }
}
