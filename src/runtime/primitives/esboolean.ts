import { ESError, IndexError, TypeError } from '../../errors';
import {Position} from '../../position';
import {ESPrimitive} from './esprimitive';
import { funcProps, str } from '../../util/util';
import {ESNumber} from './esnumber';
import {ESString} from './esstring';
import type {Primitive} from './primitive';
import { wrap } from "./wrapStrip";
import { types } from "../../constants";

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

    override __getProperty__ = (props: funcProps, key: Primitive): Primitive | ESError => {
        if (this.self.hasOwnProperty(str(key))) {
            return wrap(this.self[str(key)], true);
        }
        return new IndexError(Position.void, key.valueOf(), this);
    };

    override cast = (props: funcProps, type: Primitive) => {
        switch (type) {
            case types.number:
                return new ESNumber(this.valueOf() ? 1 : 0);
            default:
                return new ESError(Position.void, 'TypeError', `Cannot cast boolean to type '${str(type.typeName())}'`);
        }
    }

    override __eq__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESBoolean)) {
            return new TypeError(Position.void, 'Boolean', n.typeName().valueOf(), n.valueOf());
        }
        return new ESBoolean(this.valueOf() === n.valueOf());
    };
    override __bool__ = () => this;

    override __and__ = (props: funcProps, n: Primitive) =>
        new ESBoolean(this.valueOf() && n.bool().valueOf());

    override __or__ = (props: funcProps, n: Primitive): ESError | ESBoolean => {
        return new ESBoolean(this.valueOf() || n.bool().valueOf());
    };

    override str = () => new ESString(this.valueOf() ? 'true' : 'false');
    override clone = () => new ESBoolean(this.valueOf());

    override bool = () => this;

    override typeCheck = this.__eq__;
}
