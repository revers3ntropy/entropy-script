import {ESError} from '../../errors.js';
import {Context} from '../context.js';
import {createInstance} from '../instantiator.js';
import {ESBoolean} from './esboolean.js';
import {ESFunction} from './esfunction.js';
import {ESObject} from './esobject.js';
import {ESString} from './esstring.js';
import {ESPrimitive} from './esprimitive.js';
import {Primitive, types, typeName} from './primitive.js';

export class ESType extends ESPrimitive<undefined> {
    readonly __isPrimitive__: boolean;
    readonly __name__: typeName;
    readonly __extends__: undefined | ESType;
    readonly __methods__: ESFunction[];
    readonly __init__: ESFunction | undefined;
    readonly __instances__: ESObject[] = [];

    constructor (
        isPrimitive: boolean = false,
        name: typeName = '(anon)',
        __methods__: ESFunction[] = [],
        __extends__?: undefined | ESType,
        __init__?: undefined | ESFunction
    ) {
        super(undefined, types?.type);

        this.__isPrimitive__ = isPrimitive;
        this.__name__ = name;
        this.info.name = name;
        this.__extends__ = __extends__;
        this.__methods__ = __methods__;
        if (__init__) {
            __init__.name = name;
            this.__init__ = __init__;
        }

        if (!types.type)
            this.__type__ = this;
    }

    clone = (chain: Primitive[]) => {
        return new ESType(
            this.__isPrimitive__,
            this.__name__,
            this.__methods__.map(f => f.clone(chain)),
            this.__extends__,
            this.__init__?.clone(chain)
        )
    }

    isa = ({}, type: Primitive) => {
        return new ESBoolean(type === types.type);
    }

    cast = ({}, type: Primitive) => {
        return this;
    }

    includesType = ({context}: {context: Context}, t: ESType): ESBoolean => {
        if (
            this.equals({context}, types.any).valueOf() === true ||
            t.equals({context}, types.any).valueOf() === true ||

            (this.__extends__?.equals({context}, t).valueOf() === true) ||
            (this.__extends__?.equals({context}, types.any).valueOf() === true) ||
            (this.__extends__?.includesType({context}, t).valueOf() === true) ||

            (t.__extends__?.equals({context}, this).valueOf() === true) ||
            (t.__extends__?.equals({context}, types.any).valueOf() === true) ||
            (t.__extends__?.includesType({context}, this).valueOf() === true)
        ) {
            return new ESBoolean(true);
        }

        return this.equals({context}, t);
    }

    equals = ({}: {context: Context}, t: ESType): ESBoolean => {
        return new ESBoolean(
            t.__name__ === this.__name__ &&
            t.__isPrimitive__ === this.__isPrimitive__ &&
            Object.is(this.valueOf(), t.valueOf())
        );
    }

    __call__ = ({ context }: {context: Context}, ...params: Primitive[]): ESError | Primitive => {
        return createInstance(this, {context}, params || []);
    }

    str = () => new ESString(`<Type: ${this.__name__}>`);

    __bool__ = () => new ESBoolean(true);
    bool = this.__bool__;
}
