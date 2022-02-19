import { ESError, IndexError, TypeError } from '../../errors.js';
import {Position} from '../../position.js';
import {Context} from '../context.js';
import {ESPrimitive} from './esprimitive.js';
import { funcProps, str } from '../../util/util.js';
import {ESNumber} from './esnumber.js';
import {ESString} from './esstring.js';
import {Primitive, types} from './primitive.js';
import { ESFunction } from "./esfunction.js";
import { wrap } from "./wrapStrip.js";

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
    clone = (): ESBoolean => new ESBoolean(this.valueOf());

    bool = (): ESBoolean => this;
}
