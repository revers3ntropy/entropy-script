import { Error, IndexError, TypeError } from '../../errors';
import {ESPrimitive} from '../esprimitive';
import { funcProps, str } from '../../util/util';
import {ESNumber} from './esnumber';
import {ESString} from './esstring';
import type {Primitive} from '../primitive';
import { wrap } from "../wrapStrip";
import { types } from "../../util/constants";
import { ESTypeIntersection, ESTypeUnion } from "./estype";

export class ESBoolean extends ESPrimitive <boolean> {
    constructor (val = false) {
        super(Boolean(val), types.bool);

        this.__info__ = {
            name: str(val),
            description: `Boolean global constant which evaluates to ${str(val)}, the opposite of ${str(!val)}`,
            file: 'built-in',
            builtin: true,
            helpLink: 'https://en.wikipedia.org/wiki/Boolean_expression'
        };
    }

    override __get__ = (props: funcProps, key: Primitive): Primitive | Error => {
        if (this._.hasOwnProperty(str(key))) {
            return wrap(this._[str(key)], true);
        }
        return new IndexError(key.__value__, this);
    };

    override cast = (props: funcProps, type: Primitive) => {
        switch (type) {
            case types.number:
                return new ESNumber(this.__value__ ? 1 : 0);
            default:
                return new Error('TypeError', `Cannot cast boolean to type '${str(type.__type_name__())}'`);
        }
    }

    override __eq__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESBoolean)) {
            return new TypeError('Boolean', n.__type_name__(), n.__value__);
        }
        return new ESBoolean(this.__value__ === n.__value__);
    };
    override __bool__ = () => this;

    override __and__ = (props: funcProps, n: Primitive) =>
        new ESBoolean(this.__value__ && n.bool().__value__);

    override __or__ = (props: funcProps, n: Primitive): Error | ESBoolean => {
        return new ESBoolean(this.__value__ || n.bool().__value__);
    };

    override str = () => new ESString(this.__value__ ? 'true' : 'false');
    override clone = () => new ESBoolean(this.__value__);

    override bool = () => this;

    override __includes__ = this.__eq__;
    override __subtype_of__ = (props: funcProps, n: Primitive) => {
        if (Object.is(n, types.any) || Object.is(n, types.boolean)) {
            return new ESBoolean(true);
        }
        return this.__eq__(props, n);
    }

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
