import { Error, IndexError } from '../../errors';
import {ESBoolean} from './boolean';
import {ESString} from './string';
import {ESPrimitive} from '../esprimitive';
import {Primitive} from '../primitive';
import { IFuncProps, str } from '../../util/util';
import { wrap } from "../wrapStrip";
import { types } from "../../util/constants";
import { ESTypeIntersection } from "./intersection";
import { ESTypeUnion } from "./type";

export class ESNull extends ESPrimitive <undefined> {
    override __null__ = true;

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

    override __eq__ = (props: IFuncProps, n: Primitive) => {
        return new ESBoolean(
            n instanceof ESNull ||
            typeof n === 'undefined' ||
            typeof n.__value__ === 'undefined'
        );
    }

    override __bool__ = () => new ESBoolean();
    override bool = this.__bool__;

    override clone = () => new ESNull();

    override __get__ = (props: IFuncProps, key: Primitive): Primitive | Error => {

        if (str(key) in this) {
            return wrap(this._[str(key)], true);
        }
        return new IndexError(key.__value__, this);
    };

    override __includes__ = this.__eq__;
    override __subtype_of__ = (props: IFuncProps, n: Primitive) => {
        if (Object.is(n, types.any) || Object.is(n, types.undefined)) {
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

    override keys = () => {
        return Object.keys(this).map(s => new ESString(s));
    }
}
