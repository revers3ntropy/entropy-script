import { ESError, IndexError } from '../../errors';
import {Position} from '../../position';
import {Context} from '../context';
import {ESArray} from './esarray';
import {ESBoolean} from './esboolean';
import {ESErrorPrimitive} from './eserrorprimitive';
import {ESFunction} from './esfunction';
import {ESNumber} from './esnumber';
import {ESObject} from './esobject';
import {ESString} from './esstring';
import {ESType} from './estype';
import {ESPrimitive} from './esprimitive';
import {Primitive, types} from './primitive';
import { funcProps, str } from '../../util/util';
import { wrap } from "./wrapStrip";

export class ESUndefined extends ESPrimitive <undefined> {
    constructor () {
        super(undefined, types.undefined);

        // define the same info for every instance
        this.info = {
            name: 'undefined',
            description: 'Not defined, not a value.',
            file: 'built-in',
            isBuiltIn: true
        };
    }

    override cast = ({context}: {context: Context}, type: Primitive): Primitive | ESError => {
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
            return new ESFunction(() => {});
        case types.boolean:
            return new ESBoolean();
        default:
            if (!(type instanceof ESType)) {
                return new ESError(Position.void, 'TypeError', `Cannot cast to type '${str(type.typeName())}'`);
            }
            return type.__call__({context});
        }
    }

    override str = () => new ESString('<Undefined>');

    override __eq__ = (props: funcProps, n: Primitive) =>
        new ESBoolean(
            n instanceof ESUndefined ||
            typeof n === 'undefined' ||
            typeof n.valueOf() === 'undefined'
        );

    override __bool__ = () => new ESBoolean();
    override bool = this.__bool__;

    override clone = () => new ESUndefined();

    override __getProperty__ = ({}: funcProps, key: Primitive): Primitive | ESError => {
        if (this.self.hasOwnProperty(str(key))) {
            return wrap(this.self[str(key)], true);
        }
        return new IndexError(Position.void, key.valueOf(), this);
    };
}
