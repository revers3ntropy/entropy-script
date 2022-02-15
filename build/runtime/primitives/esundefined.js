import { ESError } from '../../errors.js';
import { Position } from '../../position.js';
import { ESArray } from './esarray.js';
import { ESBoolean } from './esboolean.js';
import { ESErrorPrimitive } from './eserrorprimitive.js';
import { ESFunction } from './esfunction.js';
import { ESNumber } from './esnumber.js';
import { ESObject } from './esobject.js';
import { ESString } from './esstring.js';
import { ESType } from './estype.js';
import { ESPrimitive } from './esprimitive.js';
import { types } from './primitive.js';
import { str } from '../../util/util.js';
export class ESUndefined extends ESPrimitive {
    constructor() {
        super(undefined, types.undefined);
        this.isa = ({}, type) => {
            return new ESBoolean(type === types.undefined);
        };
        this.cast = ({ context }, type) => {
            switch (type) {
                case types.number:
                    return new ESNumber();
                case types.string:
                    return new ESString();
                case types.array:
                    return new ESArray();
                case types.undefined:
                    return new ESUndefined();
                case types.type:
                    return new ESType();
                case types.error:
                    return new ESErrorPrimitive();
                case types.object:
                case types.any:
                    return new ESObject();
                case types.function:
                    return new ESFunction(() => { });
                case types.boolean:
                    return new ESBoolean();
                default:
                    if (!(type instanceof ESType)) {
                        return new ESError(Position.unknown, 'TypeError', `Cannot cast to type '${str(type.typeName())}'`);
                    }
                    return type.__call__({ context });
            }
        };
        this.str = () => new ESString('<Undefined>');
        this.__eq__ = ({}, n) => new ESBoolean(n instanceof ESUndefined ||
            typeof n === 'undefined' ||
            typeof n.valueOf() === 'undefined');
        this.__bool__ = () => new ESBoolean();
        this.bool = this.__bool__;
        this.clone = (chain) => new ESUndefined();
        // define the same info for every instance
        this.info = {
            name: 'undefined',
            description: 'Not defined, not a value.',
            file: 'built-in',
            isBuiltIn: true
        };
    }
}
