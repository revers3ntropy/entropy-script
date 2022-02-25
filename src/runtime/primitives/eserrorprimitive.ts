import {ESPrimitive} from './esprimitive';
import { ESError, IndexError } from '../../errors';
import {Position} from '../../position';
import {ESBoolean} from './esboolean';
import {ESString} from './esstring';
import {Primitive, types} from './primitive';
import type { funcProps } from "../../util/util";
import { ESFunction } from "./esfunction";
import { wrap } from "./wrapStrip";
import {str} from "../../util/util";

export class ESErrorPrimitive extends ESPrimitive <ESError> {
    constructor (error: ESError = new ESError(Position.unknown, 'Unknown', 'Error not specified')) {
        super(error, types.error);
    }

    __getProperty__ = (props: funcProps, key: Primitive): Primitive | ESError => {
        if (this.self.hasOwnProperty(str(key))) {
            const val = this.self[str(key)];
            if (typeof val === 'function') {
                return new ESFunction(val);
            }
            return wrap(val);
        }
        return new IndexError(Position.unknown, key.valueOf(), this);
    };

    cast = ({}) =>
        new ESError(Position.unknown, 'TypeError', `Cannot cast type 'error'`);


    str = () =>
        new ESString(`<Error: ${this.valueOf().str}>`);

    __eq__ = (props: funcProps, n: Primitive) =>
        new ESBoolean(
            n instanceof ESErrorPrimitive &&
            this.valueOf().constructor === n.valueOf().constructor
        );

    __bool__ = () => new ESBoolean(true);
    bool = this.__bool__;

    clone = () => new ESErrorPrimitive(this.valueOf());
}
