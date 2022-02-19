import { ESPrimitive } from './esprimitive.js';
import { ESError, IndexError } from '../../errors.js';
import { Position } from '../../position.js';
import { ESBoolean } from './esboolean.js';
import { ESString } from './esstring.js';
import { types } from './primitive.js';
import { ESFunction } from "./esfunction.js";
import { wrap } from "./wrapStrip.js";
import { str } from "../../util/util.js";
export class ESErrorPrimitive extends ESPrimitive {
    constructor(error = new ESError(Position.unknown, 'Unknown', 'Error not specified')) {
        super(error, types.error);
        this.__getProperty__ = ({}, key) => {
            if (this.self.hasOwnProperty(str(key))) {
                const val = this.self[str(key)];
                if (typeof val === 'function') {
                    return new ESFunction(val);
                }
                return wrap(val);
            }
            return new IndexError(Position.unknown, key.valueOf(), this);
        };
        this.cast = ({}) => {
            return new ESError(Position.unknown, 'TypeError', `Cannot cast type 'error'`);
        };
        this.str = () => new ESString(`<Error: ${this.valueOf().str}>`);
        this.__eq__ = ({}, n) => new ESBoolean(n instanceof ESErrorPrimitive &&
            this.valueOf().constructor === n.valueOf().constructor);
        this.__bool__ = () => new ESBoolean(true);
        this.bool = this.__bool__;
        this.clone = () => new ESErrorPrimitive(this.valueOf());
    }
}
