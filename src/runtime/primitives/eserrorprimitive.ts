import {ESPrimitive} from './esprimitive.js';
import { ESError, IndexError } from '../../errors.js';
import {Position} from '../../position.js';
import {ESBoolean} from './esboolean.js';
import {ESString} from './esstring.js';
import {Primitive, types} from './primitive.js';
import type { funcProps } from "../../util/util.js";
import { ESFunction } from "./esfunction.js";
import { wrap } from "./wrapStrip.js";
import {str} from "../../util/util.js";

export class ESErrorPrimitive extends ESPrimitive <ESError> {
    constructor (error: ESError = new ESError(Position.unknown, 'Unknown', 'Error not specified')) {
        super(error, types.error);
    }

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

    cast = ({}) => {
        return new ESError(Position.unknown, 'TypeError', `Cannot cast type 'error'`);
    }

    str = () => new ESString(`<Error: ${this.valueOf().str}>`);

    __eq__ = ({}: funcProps, n: Primitive) =>
        new ESBoolean(
            n instanceof ESErrorPrimitive &&
            this.valueOf().constructor === n.valueOf().constructor
        );

    __bool__ = () => new ESBoolean(true);
    bool = this.__bool__;

    clone = (): ESErrorPrimitive => new ESErrorPrimitive(this.valueOf());
}
