import {ESPrimitive} from './esprimitive';
import { ESError, InvalidOperationError, TypeError } from '../../errors';
import {createInstance} from '../instantiator';
import {ESBoolean} from './esboolean';
import type {ESFunction} from './esfunction';
import type {ESObject} from './esobject';
import {ESString} from './esstring';
import type {Primitive, typeName} from './primitive';
import type { funcProps } from "../../util/util";
import { wrap } from "./wrapStrip";
import Position from "../../position";
import {str} from "../../util/util";
import { types } from "../../util/constants";
import { ESTypeArray } from "./esarray";

export class ESType extends ESPrimitive <undefined> {

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

    override type_check = (props: funcProps, n: Primitive): ESBoolean | ESError => {
        if (!n) return new ESBoolean();
        let t = n.__type__;

        if (
            this === types.any ||
            t === types.any ||
            this === t
        ) {
            return new ESBoolean(true);
        }

        while (t instanceof ESType) {
            if (t.__extends__?.__eq__(props, this).valueOf() === true) {
                return new ESBoolean(true);
            }
            if (!t.__extends__) {
                break;
            }
            t = t.__extends__;
        }

        return new ESBoolean();
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

    override __get_property__ = (props: funcProps, k: Primitive): Primitive | ESError => {
        if (!(k instanceof ESString)) {
            if (this === types.array) {
                return new ESTypeArray(k);
            }
            return new TypeError(Position.void, 'string', k.typeName(), str(k));
        }
        const key = k.valueOf();
        if (this.self.hasOwnProperty(key)) {
            return wrap(this.self[key], true);
        }
        return new ESTypeArray(k);
    };

    override __pipe__ (props: funcProps, n: Primitive): Primitive | ESError {
        return new ESTypeUnion(this, n);
    }
    override __ampersand__ (props: funcProps, n: Primitive): Primitive | ESError {
        return new ESTypeIntersection(this, n);
    }
}

export class ESTypeUnion extends ESType {

    private readonly __left__: Primitive;
    private readonly __right__: Primitive;

    constructor (left: Primitive, right: Primitive) {
        super(false, `(${str(left)}) | (${str(right)})`);
        this.__left__ = left;
        this.__right__ = right;
    }

    override __call__ = (props: funcProps, ...params: Primitive[]): ESError | Primitive => {
        return new InvalidOperationError('__call__', this);
    }

    override type_check = (props: funcProps, t: Primitive): ESBoolean | ESError => {
        const leftRes = this.__left__.type_check(props, t);
        const rightRes = this.__right__.type_check(props, t);
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

    override __eq__ = (props: funcProps, t: Primitive): ESBoolean => {
        return new ESBoolean(
            t instanceof ESTypeUnion &&
            this.__left__.__eq__(props, t.__left__).valueOf() === true &&
            this.__right__.__eq__(props, t.__right__).valueOf() === true
        );
    }
}


export class ESTypeIntersection extends ESType {

    private readonly __left__: Primitive;
    private readonly __right__: Primitive;

    constructor (left: Primitive, right: Primitive) {
        super(false, `(${str(left)}) & (${str(right)})`);
        this.__left__ = left;
        this.__right__ = right;
    }

    override __call__ = (props: funcProps, ...params: Primitive[]): ESError | Primitive => {
        return new InvalidOperationError('__call__', this);
    }

    override type_check = (props: funcProps, t: Primitive): ESBoolean | ESError => {
        const leftRes = this.__left__.type_check(props, t);
        const rightRes = this.__right__.type_check(props, t);
        if (leftRes instanceof ESError) return leftRes;
        if (rightRes instanceof ESError) return rightRes;

        return new ESBoolean(
            leftRes.valueOf() &&
            rightRes.valueOf()
        );
    }

    override clone = () => {
        return new ESTypeIntersection(this.__left__, this.__right__);
    }


    override __eq__ = (props: funcProps, t: Primitive): ESBoolean => {
        return new ESBoolean(
            t instanceof ESTypeIntersection &&
            this.__left__.__eq__(props, t.__left__).valueOf() === true &&
            this.__right__.__eq__(props, t.__right__).valueOf() === true
        );
    }
}

export class ESTypeNot extends ESType {
    private readonly __val__: Primitive;

    constructor (type: Primitive) {
        super(false, `~(${str(type)})`);
        this.__val__ = type;
    }

    override __call__ = (props: funcProps, ...params: Primitive[]): ESError | Primitive => {
        return new InvalidOperationError('__call__', this);
    }

    override type_check = (props: funcProps, t: Primitive): ESBoolean | ESError => {
        const res = this.__val__.type_check(props, t);
        if (res instanceof ESError) return res;

        return new ESBoolean(
            !res.valueOf()
        );
    }

    override clone = () => {
        return new ESTypeNot(this.__val__);
    }

    override __eq__ = (props: funcProps, t: Primitive): ESBoolean => {
        return new ESBoolean(
            t instanceof ESTypeNot &&
            this.__val__.__eq__(props, t.__val__).valueOf() === true
        );
    }
}