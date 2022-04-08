import { Error, IndexError } from '../../errors';
import {Context} from '../context';
import {ESArray} from './esarray';
import {ESBoolean} from './esboolean';
import {ESErrorPrimitive} from './eserrorprimitive';
import {ESFunction} from './esfunction';
import {ESNumber} from './esnumber';
import {ESObject} from './esobject';
import {ESString} from './esstring';
import { ESType, ESTypeIntersection, ESTypeUnion } from './estype';
import {ESPrimitive} from '../esprimitive';
import {Primitive} from '../primitive';
import { funcProps, str } from '../../util/util';
import { wrap } from "../wrapStrip";
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

    override cast = (): Primitive | Error => {
        return new Error('TypeError', `Cannot cast type 'Null'`);
    }

    override str = () => new ESString('nil');

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

    override __get__ = (props: funcProps, key: Primitive): Primitive | Error => {

        if (str(key) in this) {
            return wrap(this._[str(key)], true);
        }
        return new IndexError(key.__value__, this);
    };

    override __includes__ = this.__eq__;
    override __subtype_of__ = (props: funcProps, n: Primitive) => {
        if (Object.is(n, types.any) || Object.is(n, types.undefined)) {
            return new ESBoolean(true);
        }
        return this.__eq__(props, n);
    };

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
