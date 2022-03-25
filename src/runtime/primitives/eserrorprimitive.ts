import {ESPrimitive} from './esprimitive';
import { ESError, IndexError } from '../../errors';
import Position from '../../position';
import {ESBoolean} from './esboolean';
import {ESString} from './esstring';
import type {Primitive} from './primitive';
import type { funcProps } from "../../util/util";
import { wrap } from "./wrapStrip";
import {str} from "../../util/util";
import { ESArray } from "./esarray";
import { types } from "../../util/constants.js";
import { ESTypeIntersection, ESTypeUnion } from "./estype";

export class ESErrorPrimitive extends ESPrimitive <ESError> {
    constructor (error: ESError = new ESError(Position.void, 'Unknown', 'Error not specified')) {
        super(error, types.error);
    }

    override __get_property__ = (props: funcProps, key: Primitive): Primitive | ESError => {

        switch (str(key)) {

            case 'name':
                return new ESString(this.valueOf().name);
            case 'details':
                return new ESString(this.valueOf().details);

            case 'traceback':
                return new ESArray(this.valueOf().traceback
                        .map(s => new ESString(`${s.position.str} : ${s.line}`)));

            default:
                if (this.self.hasOwnProperty(str(key))) {
                    return wrap(this.self[str(key)], true);
                }
                return new IndexError(Position.void, key.valueOf(), this);
        }
    };

    override cast = () =>
        new ESError(Position.void, 'TypeError', `Cannot cast type 'error'`);


    override str = () =>
        new ESString(`<Error: ${this.valueOf().str}>`);

    override __eq__ = (props: funcProps, n: Primitive) => {
        return new ESBoolean(
            n instanceof ESErrorPrimitive &&
            this.valueOf().constructor === n.valueOf().constructor
        );
    }

    override __bool__ = () => new ESBoolean(true);
    override bool = this.__bool__;

    override clone = () => new ESErrorPrimitive(this.valueOf());

    override type_check = this.__eq__;

    override __pipe__ (props: funcProps, n: Primitive): Primitive | ESError {
        return new ESTypeUnion(this, n);
    }
    override __ampersand__ (props: funcProps, n: Primitive): Primitive | ESError {
        return new ESTypeIntersection(this, n);
    }
}
