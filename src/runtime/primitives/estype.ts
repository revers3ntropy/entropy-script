import {ESPrimitive} from '../esprimitive';
import { Error, InvalidOperationError, TypeError } from '../../errors';
import {createInstance} from '../instantiator';
import {ESBoolean} from './esboolean';
import type {ESFunction} from './esfunction';
import {ESObject} from './esobject';
import {ESString} from './esstring';
import type {Primitive, typeName} from '../primitive';
import type {dict, funcProps} from '../../util/util';
import { wrap } from "../wrapStrip";
import {str} from "../../util/util";
import { types } from "../../util/constants";
import { ESTypeArray } from "./esarray";
import type { runtimeArgument } from "../argument";

export class ESType extends ESPrimitive <undefined> {

    readonly __primordial__: boolean;

    readonly __name__: typeName;
    readonly __extends__: undefined | ESType;
    readonly __methods__: ESFunction[];
    readonly __properties__: dict<Primitive>;
    readonly __instances__: Primitive[] = [];
    readonly __targs__: runtimeArgument[];
    readonly __abstract__: boolean;

    constructor (
        isPrimitive: boolean = false,
        name: typeName = '(anon)',
        methods: ESFunction[] = [],
        properties: dict<Primitive> = {},
        extends_?: undefined | ESType,
        targs: runtimeArgument[] = [],
        abstract = false
    ) {
        super(undefined, types?.type);

        this.__primordial__ = isPrimitive;
        this.__name__ = name;
        this.__info__.name = name;
        this.__extends__ = extends_;
        this.__methods__ = methods;
        this.__properties__ = properties;
        this.__targs__ = targs;
        this.__abstract__ = abstract;

        if (!types.type) {
            this.__type__ = this;
        }
    }

    override clone = () => {
        return new ESType(
            this.__primordial__,
            this.__name__,
            this.__methods__,
            this.__properties__,
            this.__extends__,
            this.__targs__
        )
    }

    override isa = (props: funcProps, type: Primitive) => {
        return new ESBoolean(type === types.type);
    }

    override cast = (): Error => {
        return new InvalidOperationError('cast', this);
    }

    override __includes__ = (props: funcProps, n: Primitive): ESBoolean | Error => {
        if (!n) return new ESBoolean();
        let t = n.__type__;

        if (
            this === types.any ||
            t === types.any ||
            this === t
        ) {
            return new ESBoolean(true);
        }

        return t.__subtype_of__(props, this);
    }

    override __subtype_of__ = (props: funcProps, t: Primitive): ESBoolean | Error => {
        if (Object.is(t, types.any)) {
            return new ESBoolean(true);
        }

        if (!t) {
            return new ESBoolean();
        }

        if (
            this === types.any ||
            this === t
        ) {
            return new ESBoolean(true);
        }

        if (this.__extends__) {
            return this.__extends__.__subtype_of__(props, t);
        }
        return new ESBoolean();
    }

    override __eq__ = (props: funcProps, t: Primitive): ESBoolean | Error => {
        return new ESBoolean(t === this);
    }

    override __call__ = (props: funcProps, ...params: Primitive[]): Error | Primitive => {
        if (this.__abstract__) {
            return new Error('TypeError', 'Cannot construct abstract class');
        }

        let res = createInstance(this, props, params || []);

        if (res instanceof Error) return res;

        if (!this.__primordial__) {

            // Type Check

            if (!(res instanceof ESObject)) {
                return new TypeError(
                    'Obj', res.__type_name__(), str(res), 'Constructors must return an object');
            }

            let properties: dict<Primitive> = {
                ...this.__properties__
            };

            let parent: ESType = this;
            while (parent.__extends__) {
                properties = {
                    ...properties,
                    ...parent.__extends__.__properties__,
                };
                parent = parent.__extends__;
            }

            // don't check the child's init function against the parents, just check that it is a function
            properties['init'] = new ESTypeUnion(types.function, types.undefined);

            let typeCheckRes = res.isa(props, new ESObject(properties));
            if (typeCheckRes instanceof Error) return typeCheckRes;
            if (!typeCheckRes.__value__) {
                return new Error('TypeError', 'Initializer incorrectly assigned properties');
            }
        }

        this.__instances__.push(res);
        return res;
    }

    override str = () => new ESString(this.__name__);

    override __bool__ = () => new ESBoolean(true);
    override bool = this.__bool__;

    override __get__ = (props: funcProps, k: Primitive): Primitive | Error => {
        if (!(k instanceof ESString)) {
            if (this === types.array) {
                return new ESTypeArray(k);
            }
            return new TypeError('string', k.__type_name__(), str(k));
        }
        const key = k.__value__;
        if (this._.hasOwnProperty(key)) {
            return wrap(this._[key], true);
        }
        return new ESTypeArray(k);
    };

    override __pipe__ (props: funcProps, n: Primitive): Primitive | Error {
        return new ESTypeUnion(this, n);
    }
    override __ampersand__ (props: funcProps, n: Primitive): Primitive | Error {
        return new ESTypeIntersection(this, n);
    }


    override keys = () => {
        return Object.keys(this).map(s => new ESString(s));
    }

    public __get_init__ = (): ESFunction | undefined => {
        let res = this.__methods__.filter(m => m.name === 'init');
        if (!res) return undefined;
        return res[0];
    }
}

export class ESTypeUnion extends ESType {

    readonly __left__: Primitive;
    readonly __right__: Primitive;

    constructor (left: Primitive, right: Primitive) {
        super(false, `(${str(left)}) | (${str(right)})`);
        this.__left__ = left;
        this.__right__ = right;
    }

    override __call__ = (): Error | Primitive => {
        return new InvalidOperationError('__call__', this);
    }

    override __includes__ = (props: funcProps, t: Primitive): ESBoolean | Error => {
        const leftRes = this.__left__.__includes__(props, t);
        const rightRes = this.__right__.__includes__(props, t);
        if (leftRes instanceof Error) return leftRes;
        if (rightRes instanceof Error) return rightRes;

        return new ESBoolean(
            leftRes.__value__ ||
            rightRes.__value__
        );
    }

    override __subtype_of__ = (props: funcProps, t: Primitive): ESBoolean | Error => {
        if (Object.is(t, types.any)) {
            return new ESBoolean(true);
        }

        let eqCheckRes = this.__eq__(props, t);
        if (eqCheckRes instanceof Error) {
            return eqCheckRes;
        }
        if (eqCheckRes.__value__) {
            return new ESBoolean(true);
        }

        const leftRes = this.__left__.__subtype_of__(props, t);
        const rightRes = this.__right__.__subtype_of__(props, t);
        if (leftRes instanceof Error) return leftRes;
        if (rightRes instanceof Error) return rightRes;

        return new ESBoolean(
            leftRes.__value__ &&
            rightRes.__value__
        );
    }

    override clone = (): ESType => {
        return new ESTypeUnion(this.__left__, this.__right__);
    }

    override __eq__ = (props: funcProps, t: Primitive) => {
        if (!(t instanceof ESTypeUnion)) return new ESBoolean();

        let leftTypeCheckRes = this.__left__.__eq__(props, t.__left__);
        if (leftTypeCheckRes instanceof Error) return leftTypeCheckRes;

        let rightTypeCheckRes = this.__right__.__eq__(props, t.__right__);
        if (rightTypeCheckRes instanceof Error) return rightTypeCheckRes;

        return new ESBoolean(leftTypeCheckRes.__value__ && rightTypeCheckRes.__value__);
    }
}


export class ESTypeIntersection extends ESType {

    readonly __left__: Primitive;
    readonly __right__: Primitive;

    constructor (left: Primitive, right: Primitive) {
        super(false, `(${str(left)}) & (${str(right)})`);
        this.__left__ = left;
        this.__right__ = right;
    }

    override __call__ = (): Error | Primitive => {
        return new InvalidOperationError('__call__', this);
    }

    override __includes__ = (props: funcProps, t: Primitive): ESBoolean | Error => {
        const leftRes = this.__left__.__includes__(props, t);
        const rightRes = this.__right__.__includes__(props, t);
        if (leftRes instanceof Error) return leftRes;
        if (rightRes instanceof Error) return rightRes;

        return new ESBoolean(
            leftRes.__value__ &&
            rightRes.__value__
        );
    }

    override __subtype_of__ = (props: funcProps, t: Primitive): ESBoolean | Error => {
        if (t === types.any) {
            return new ESBoolean(true);
        }

        let eqCheckRes = this.__eq__(props, t);
        if (eqCheckRes instanceof Error) {
            return eqCheckRes;
        }
        if (eqCheckRes.__value__) {
            return new ESBoolean(true);
        }

        const leftRes = this.__left__.__subtype_of__(props, t);
        const rightRes = this.__right__.__subtype_of__(props, t);
        if (leftRes instanceof Error) return leftRes;
        if (rightRes instanceof Error) return rightRes;

        return new ESBoolean(
            leftRes.__value__ ||
            rightRes.__value__
        );
    }

    override clone = () => {
        return new ESTypeIntersection(this.__left__, this.__right__);
    }

    override __eq__ = (props: funcProps, t: Primitive) => {
        if (!(t instanceof ESTypeIntersection)) return new ESBoolean();

        let leftTypeCheckRes = this.__left__.__eq__(props, t.__left__);
        if (leftTypeCheckRes instanceof Error) return leftTypeCheckRes;

        let rightTypeCheckRes = this.__right__.__eq__(props, t.__right__);
        if (rightTypeCheckRes instanceof Error) return rightTypeCheckRes;

        return new ESBoolean(leftTypeCheckRes.__value__ && rightTypeCheckRes.__value__);
    }
}

export class ESTypeNot extends ESType {
    private readonly __val__: Primitive;

    constructor (type: Primitive) {
        super(false, `~(${str(type)})`);
        this.__val__ = type;
    }

    override __call__ = (): Error | Primitive => {
        return new InvalidOperationError('__call__', this);
    }

    override __includes__ = (props: funcProps, t: Primitive): ESBoolean | Error => {
        const res = this.__val__.__includes__(props, t);
        if (res instanceof Error) return res;

        return new ESBoolean(!res.__value__);
    }

    override __subtype_of__ = (props: funcProps, t: Primitive): ESBoolean | Error => {
        if (Object.is(t, types.any)) {
            return new ESBoolean(true);
        }

        /*
            weird case caught here:
            (~Str).__subtype_of__(Str | Num)
            should be false as it could be a string
        */
        if (t instanceof ESTypeUnion || t instanceof ESTypeIntersection) {
            let leftRes = t.__left__.__subtype_of__(props, this.__val__);
            if (leftRes instanceof Error) return leftRes;
            if (leftRes.__value__) return new ESBoolean();

            let rightRes = t.__right__.__subtype_of__(props, this.__val__);
            if (rightRes instanceof Error) return rightRes;
            if (rightRes.__value__) return new ESBoolean();
            return new ESBoolean(true);
        }

        const res = this.__val__.__subtype_of__(props, t);
        if (res instanceof Error) return res;

        return new ESBoolean(!res.__value__);
    }

    override clone = () => {
        return new ESTypeNot(this.__val__);
    }

    override __eq__ = (props: funcProps, t: Primitive) => {
        if (!(t instanceof ESTypeNot)) {
            return new ESBoolean();
        }

        let typeCheckRes = this.__val__.__eq__(props, t.__val__);
        if (typeCheckRes instanceof Error) {
            return typeCheckRes;
        }
        return new ESBoolean(typeCheckRes.__value__ === true);
    }
}