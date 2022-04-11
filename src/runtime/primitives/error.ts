import {ESPrimitive} from '../primitive';
import {Error, IndexError, InvalidOperationError, TypeError} from '../../errors';
import {ESBoolean} from './boolean';
import {ESString} from './string';
import type { IFuncProps, Primitive } from "../../util/util";
import { wrap } from "../wrapStrip";
import { ESArray } from "./array";
import { types } from "../../util/constants";
import { ESTypeIntersection } from "./intersection";
import { ESTypeUnion } from "./type";
import { str } from "../../util/util";

export class ESErrorPrimitive extends ESPrimitive <Error> {
    constructor (error: Error = new Error('Unknown', 'Error not specified')) {
        super(error, types.error);
    }

    override __get__ = (props: IFuncProps, key: Primitive): Primitive | Error => {

        switch (str(key)) {

            case 'name':
                return new ESString(this.__value__.name);
            case 'details':
                return new ESString(this.__value__.details);

            case 'traceback':
                return new ESArray(this.__value__.traceback
                        .map(s => new ESString(`${s.position.str} : ${s.line}`)));

            default:
                if (str(key) in this) {
                    return wrap(this._[str(key)], true);
                }
                return new IndexError(key.__value__, this);
        }
    };

    override cast = () =>
        new Error('TypeError', `Cannot cast type 'error'`);


    override str = () =>
        new ESString(`<Error: ${this.__value__.str}>`);

    override __eq__ = (props: IFuncProps, n: Primitive) => {
        return new ESBoolean(
            n instanceof ESErrorPrimitive &&
            this.__value__.name === n.__value__.name
        );
    }

    override __bool__ = () => new ESBoolean(true);
    override bool = this.__bool__;

    override clone = () => new ESErrorPrimitive(this.__value__);

    override __includes__ = (): Error => new InvalidOperationError('type check', this, 'Cannot type check against an error instance');

    override __subtype_of__ = (props: IFuncProps, n: Primitive): ESBoolean | Error => {
        if (Object.is(n, types.any)) {
            return new ESBoolean(true);
        }
        return new InvalidOperationError('type check', this, 'Cannot type check against an error instance');
    }
    override __pipe__ = (props: IFuncProps, n: Primitive): Primitive | Error => {
        return new ESTypeUnion(this, n);
    }
    override __ampersand__ = (props: IFuncProps, n: Primitive): Primitive | Error => {
        return new ESTypeIntersection(this, n);
    }

    override keys = () => {
        return [...Object.keys(this), 'name', 'traceback', 'details'].map(s => new ESString(s));
    }
}
