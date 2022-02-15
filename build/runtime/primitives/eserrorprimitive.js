import { ESError } from '../../errors.js';
import { Position } from '../../position.js';
import { ESPrimitive } from './esprimitive.js';
import { ESBoolean } from './esboolean.js';
import { ESString } from './esstring.js';
import { types } from './primitive.js';
export class ESErrorPrimitive extends ESPrimitive {
    constructor(error = new ESError(Position.unknown, 'Unknown', 'error type not specified')) {
        super(error, types.error);
        this.isa = ({}, type) => {
            return new ESBoolean(type === types.error);
        };
        this.cast = ({}) => {
            return new ESError(Position.unknown, 'TypeError', `Cannot cast type 'error'`);
        };
        this.str = () => new ESString(`<Error: ${this.valueOf().str}>`);
        this.__eq__ = ({}, n) => new ESBoolean(n instanceof ESErrorPrimitive &&
            this.valueOf().constructor === n.valueOf().constructor);
        this.__bool__ = () => new ESBoolean(true);
        this.bool = this.__bool__;
        this.clone = (chain) => new ESErrorPrimitive(this.valueOf());
    }
}
