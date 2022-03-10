import { ESError, IndexError, InvalidOperationError, TypeError } from '../../errors';
import {createInstance} from '../instantiator';
import {ESBoolean} from './esboolean';
import {ESFunction} from './esfunction';
import {ESObject} from './esobject';
import {ESString} from './esstring';
import {ESPrimitive} from './esprimitive';
import {Primitive, types, typeName} from './primitive';
import { funcProps } from "../../util/util";
import { wrap } from "./wrapStrip";
import { Position } from "../../position";
import {str} from "../../util/util";

export class ESType extends ESPrimitive<undefined> {

    readonly primitive: boolean;

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

        this.primitive = isPrimitive;
        this.__name__ = name;
        this.info.name = name;
        this.__extends__ = __extends__;
        this.__methods__ = __methods__;

        if (__init__) {
            __init__.name = name;
            this.__init__ = __init__;
        }

        if (!types.type) {
            this.__type__ = this;
        }
    }

    override clone = () => {
        return new ESType(
            this.primitive,
            this.__name__,
            this.__methods__,
            this.__extends__,
            this.__init__
        )
    }

    override isa = (props: funcProps, type: Primitive) => {
        return new ESBoolean(type === types.type);
    }

    override cast = (props: funcProps, type: Primitive): ESError => {
        return new InvalidOperationError('cast', this);
    }

    override typeCheck = (props: funcProps, n: Primitive): ESBoolean | ESError => {
        if (!n) return new ESBoolean();
        let t = n.__type__;
        if (
            this === types.any ||
            t === types.any ||
            t === this ||
            this.__extends__ === t ||
            this.__extends__ === types.any ||
            this.__extends__ === n ||
            (this.__extends__?.typeCheck(props, n).valueOf() === true)
        ) {
            return new ESBoolean(true);
        }

        if (t instanceof ESType) {
            if (
                t.__extends__ === this ||
                t.__extends__ === types.any ||
                (t.__extends__?.typeCheck(props, this).valueOf() === true)
            ) {
                return new ESBoolean(true);
            }
        }

        return new ESBoolean(this === t);
    }

    override __eq__ = (props: funcProps, t: Primitive): ESBoolean => {
        return new ESBoolean(t === this);
    }

    override __call__ = (props: funcProps, ...params: Primitive[]): ESError | Primitive => {
        return createInstance(this, props, params || []);
    }

    override str = () => new ESString(this.__name__);

    override __bool__ = () => new ESBoolean(true);
    override bool = this.__bool__;

    override __getProperty__ = (props: funcProps, k: Primitive): Primitive | ESError => {
        if (!(k instanceof ESString)) {
            return new TypeError(Position.void, 'string', k.typeName(), str(k));
        }
        const key = k.valueOf();
        if (this.self.hasOwnProperty(key)) {
            return wrap(this.self[str(key)], true);
        }
        return new IndexError(Position.void, key, this);
    };

    override __pipe__ (props: funcProps, n: Primitive): Primitive | ESError {
        if (!(n instanceof ESType)) {
            return new TypeError(Position.void, 'type', n.typeName(), str(n));
        }
        return new ESTypeUnion(this, n);
    }
}

export class ESTypeUnion extends ESType {

    private readonly __left__: ESType;
    private readonly __right__: ESType;

    constructor (left: ESType, right: ESType) {
        super(false, `(${left.__name__}) | (${right.__name__})`);
        this.__left__ = left;
        this.__right__ = right;
    }

    override __call__ = (props: funcProps, ...params: Primitive[]): ESError | Primitive => {
        return new InvalidOperationError('__call__', this);
    }

    override typeCheck = (props: funcProps, t: Primitive): ESBoolean | ESError => {
        const leftRes = this.__left__.typeCheck(props, t);
        const rightRes = this.__right__.typeCheck(props, t);
        if (leftRes instanceof ESError) return leftRes;
        if (rightRes instanceof ESError) return rightRes;

        return new ESBoolean(
            leftRes.valueOf() ||
            rightRes.valueOf()
        );
    }

    override clone = () => {
        return new ESTypeUnion(this.__left__, this.__right__);
    }
}
