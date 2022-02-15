import {ESError} from '../../errors.js';
import {Position} from '../../position.js';
import {Context} from '../context.js';
import {ESPrimitive} from './esprimitive.js';
import {ESBoolean} from './esboolean.js';
import {ESString} from './esstring.js';
import {Primitive, types} from './primitive.js';

export class ESErrorPrimitive extends ESPrimitive <ESError> {
    constructor (error: ESError = new ESError(Position.unknown, 'Unknown', 'error type not specified')) {
        super(error, types.error);
    }

    isa = ({}, type: Primitive) => {
        return new ESBoolean(type === types.error);
    }

    cast = ({}) => {
        return new ESError(Position.unknown, 'TypeError', `Cannot cast type 'error'`);
    }

    str = () => new ESString(`<Error: ${this.valueOf().str}>`);

    __eq__ = ({}: {context: Context}, n: Primitive) =>
        new ESBoolean(
            n instanceof ESErrorPrimitive &&
            this.valueOf().constructor === n.valueOf().constructor
        );

    __bool__ = () => new ESBoolean(true);
    bool = this.__bool__;

    clone = (chain: Primitive[]): ESErrorPrimitive => new ESErrorPrimitive(this.valueOf());
}
