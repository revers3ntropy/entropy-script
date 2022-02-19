import { ESError, IndexError, TypeError } from '../../errors.js';
import { Position } from '../../position.js';
import { ESPrimitive } from './esprimitive.js';
import { str } from '../../util/util.js';
import { ESNumber } from './esnumber.js';
import { ESString } from './esstring.js';
import { types } from './primitive.js';
import { ESFunction } from "./esfunction.js";
import { wrap } from "./wrapStrip.js";
export class ESBoolean extends ESPrimitive {
    constructor(val = false) {
        super(Boolean(val), types.bool);
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
        this.cast = ({}, type) => {
            switch (type) {
                case types.number:
                    return new ESNumber(this.valueOf() ? 1 : 0);
                default:
                    return new ESError(Position.unknown, 'TypeError', `Cannot cast boolean to type '${str(type.typeName())}'`);
            }
        };
        this.__eq__ = ({}, n) => {
            if (!(n instanceof ESBoolean)) {
                return new TypeError(Position.unknown, 'Boolean', n.typeName().valueOf(), n.valueOf());
            }
            return new ESBoolean(this.valueOf() === n.valueOf());
        };
        this.__bool__ = () => this;
        this.__and__ = ({}, n) => {
            return new ESBoolean(this.valueOf() && n.bool().valueOf());
        };
        this.__or__ = ({}, n) => {
            return new ESBoolean(this.valueOf() || n.bool().valueOf());
        };
        this.str = () => new ESString(this.valueOf() ? 'true' : 'false');
        this.clone = () => new ESBoolean(this.valueOf());
        this.bool = () => this;
        this.info = {
            name: str(val),
            description: `Boolean global constant which evaluates to ${str(val)}, the opposite of ${str(!val)}`,
            file: 'built-in',
            isBuiltIn: true,
            helpLink: 'https://en.wikipedia.org/wiki/Boolean_expression'
        };
    }
}
