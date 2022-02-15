import {ESError, TypeError} from '../../errors.js';
import {Position} from '../../position.js';
import {Context} from '../context.js';
import {ESPrimitive} from './esprimitive.js';
import {str} from '../../util/util.js';
import {ESNumber} from './esnumber.js';
import {ESString} from './esstring.js';
import {Primitive, types} from './primitive.js';

export class ESBoolean extends ESPrimitive <boolean> {
    constructor (val: boolean = false) {
        super(Boolean(val), types.bool);

        this.info = {
            name: str(val),
            description: `Boolean global constant which evaluates to ${str(val)}, the opposite of ${str(!val)}`,
            file: 'built-in',
            isBuiltIn: true,
            helpLink: 'https://en.wikipedia.org/wiki/Boolean_expression'
        };
    }

    isa = ({}, type: Primitive) => {
        return new ESBoolean(type === types.bool);
    }

    cast = ({}, type: Primitive) => {
        switch (type) {
            case types.number:
                return new ESNumber(this.valueOf() ? 1 : 0);
            default:
                return new ESError(Position.unknown, 'TypeError', `Cannot cast boolean to type '${str(type.typeName())}'`);
        }
    }

    __eq__ = ({}: {context: Context}, n: Primitive) => {
        if (!(n instanceof ESBoolean)) {
            return new TypeError(Position.unknown, 'Boolean', n.typeName().valueOf(), n.valueOf());
        }
        return new ESBoolean(this.valueOf() === n.valueOf());
    };
    __bool__ = () => this;

    __and__ = ({}: {context: Context}, n: Primitive) => {
        return new ESBoolean(this.valueOf() && n.bool().valueOf());
    };

    __or__ = ({}: {context: Context}, n: Primitive): ESError | ESBoolean => {
        return new ESBoolean(this.valueOf() || n.bool().valueOf());
    };

    str = () => new ESString(this.valueOf() ? 'true' : 'false');
    clone = (chain: Primitive[]): ESBoolean => new ESBoolean(this.valueOf());

    bool = (): ESBoolean => this;
}
