import { ESPrimitive } from '../primitive';
import { Error, IndexError, InvalidOperationError, TypeError } from '../../errors';
import { createInstance } from '../instantiator';
import { ESBoolean } from './boolean';
import type { ESFunction } from './function';
import { ESObject } from './object';
import { ESString } from './string';
import type { IFuncProps, Map, Primitive } from '../../util/util';
import { wrap } from "../wrapStrip";
import { types } from "../../util/constants";
import type { IRuntimeArgument } from "../argument";
import { ESTypeIntersection } from "./intersection";
import { str } from "../../util/util";

const typeIds: string[] = [];
function generateId(): string {
    let id = "";
    for (let i = 0; i < 10; i++) {
        id += String.fromCharCode(Math.floor(Math.random() * 26) + 97);
    }
    if (typeIds.includes(id)) {
        return generateId();
    }
    typeIds.push(id);
    return id;
}


export class ESType extends ESPrimitive <undefined> {

    readonly __primordial__: boolean;

    readonly __name__: string;
    readonly __extends__: undefined | ESType;
    readonly __methods__: ESFunction[];
    readonly __properties__: Map<Primitive>;
    readonly __abstract__: boolean;
    readonly __type_id__: string;

    __generic_types__: Primitive[] = [];
    readonly __gargs__: IRuntimeArgument[];

    constructor (
        isPrimitive = false,
        name = '(anon)',
        methods: ESFunction[] = [],
        properties: Map<Primitive> = {},
        extends_?: ESType,
        gargs: IRuntimeArgument[] = [],
        abstract = false,
        id?: string
    ) {
        super(undefined, types?.type);

        this.__primordial__ = isPrimitive;
        this.__name__ = name;
        this.__info__.name = name;
        this.__extends__ = extends_;
        this.__methods__ = methods;
        this.__properties__ = properties;
        this.__gargs__ = gargs;
        this.__abstract__ = abstract;
        this.__type_id__ = id ?? generateId();

        if (!types.type) {
            this.__type__ = this;
        }
    }

    override clone = () => {
        const clone = new ESType(
            this.__primordial__,
            this.__name__,
            this.__methods__,
            this.__properties__,
            this.__extends__,
            this.__gargs__,
            this.__abstract__,
            this.__type_id__
        );
        clone.__generic_types__ = this.__generic_types__;
        clone.__generics_match__ = this.__generics_match__;
        return clone;
    }

    override isa = (props: IFuncProps, type: Primitive) => {
        return new ESBoolean(type === types.type);
    }

    override cast = (): Error => {
        return new InvalidOperationError('cast', this);
    }

    public __generics_match__ = (props: IFuncProps, generics: Primitive[], instance: Primitive): ESBoolean | Error => {
        return new ESBoolean(true);
    }

    override __includes__ = (props: IFuncProps, n: Primitive): ESBoolean | Error => {
        if (!n) return new ESBoolean();
        const t = n.__type__;

        if (
            this === types.any ||
            t === types.any ||
            this === t
        ) {
            return new ESBoolean(true);
        }

        if (!(t instanceof ESType && this.__type_id__ === t.__type_id__)) {
            const subTypeRes = t.__subtype_of__(props, this);
            if (subTypeRes instanceof Error) return subTypeRes;
            if (!subTypeRes.__bool__().__value__) return new ESBoolean();
        }

        const genericMatchRes = this.__generics_match__(props, this.__generic_types__, n);
        if (genericMatchRes instanceof Error) {
            return genericMatchRes;
        }

        if (!genericMatchRes.__bool__().__value__) {
            return new ESBoolean();
        }
        return new ESBoolean(true);
    }

    override __subtype_of__ = (props: IFuncProps, t: Primitive): ESBoolean | Error => {
        if (Object.is(t, types.any)) {
            return new ESBoolean(true);
        }

        if (!(t instanceof ESType)) {
            return new ESBoolean();
        }

        if (
            this === types.any ||
            this === t
        ) {
            return new ESBoolean(true);
        }

        if (this.__extends__) {
            const extendsSubtypeRes = this.__extends__.__subtype_of__(props, t);
            if (extendsSubtypeRes instanceof Error) {
                return extendsSubtypeRes;
            }
            if (extendsSubtypeRes.__bool__().__value__) {
                return extendsSubtypeRes;
            }
        }

        for (let i = 0; i < t.__generic_types__.length; i++) {
            const thisGarg = this.__generic_types__[i] ?? types.any;

            const tGarg = t.__generic_types__[i];

            const typeCheckRes = thisGarg.__subtype_of__(props, tGarg);
            if (typeCheckRes instanceof Error) return typeCheckRes;

            if (!typeCheckRes.__bool__().__value__) {
                return new ESBoolean();
            }
        }

        return new ESBoolean(this.__type_id__ === t.__type_id__);
    }

    override __eq__ = (props: IFuncProps, t: Primitive): ESBoolean | Error => {
        return new ESBoolean(t === this);
    }

    override __call__ = (props: IFuncProps, ...params: Primitive[]): Error | Primitive => {
        if (this.__abstract__) {
            return new Error('TypeError', 'Cannot construct abstract class');
        }

        const res = createInstance(this, props, params || [], this.__generic_types__);

        if (res instanceof Error) return res;

        if (this.__primordial__) {
            return res;
        }

        // Type Check

        if (!(res instanceof ESObject)) {
            return new TypeError(
                'Obj',
                res.__type_name__(),
                str(res),
                'Constructors must return an object'
            );
        }

        let properties: Map<Primitive> = {
            ...this.__properties__
        };

        let parent: ESType | undefined = this.__extends__;
        while (parent) {
            properties = {
                ...properties,
                ...parent.__properties__,
            };
            parent = parent.__extends__;
        }

        // don't check the child's init function against the parents,
        // just check that it is a function
        properties['init'] = new ESTypeUnion(types.function, types.undefined);

        const typeCheckRes = res.isa(props, new ESObject(properties));
        if (typeCheckRes instanceof Error) return typeCheckRes;
        if (!typeCheckRes.__value__) {
            return new Error('TypeError',
                'Initializer incorrectly assigned properties');
        }

        return res;
    }

    override str = () => {
        if (this.__generic_types__.length < 1) {
            return new ESString(this.__name__);
        }

        return new ESString(
            this.__name__ + '<|' +
            this.__generic_types__.map(str).join(', ') + '|>'
        );
    }

    override __bool__ = () => new ESBoolean(true);
    override bool = this.__bool__;

    override __get__ = (props: IFuncProps, k: Primitive): Primitive | Error => {
        const key = k.__value__;
        if (key in this) {
            return wrap(this._[key], true);
        }
        return new IndexError(str(k), this);
    };

    override __pipe__ = (props: IFuncProps, n: Primitive): Primitive | Error => {
        return new ESTypeUnion(this, n);
    }
    override __ampersand__ = (props: IFuncProps, n: Primitive): Primitive | Error => {
        return new ESTypeIntersection(this, n);
    }

    override keys = () => {
        return Object.keys(this).map(s => new ESString(s));
    }

    public __get_init__ = (): ESFunction | undefined => {
        const res = this.__methods__.filter(m => m.name === 'init');
        if (!res) return undefined;
        return res[0];
    }

    override __generic__ = (props: IFuncProps, ...args: Primitive[]): Error | Primitive => {
        const generic = this.clone();
        if (props.dontTypeCheck) return generic;
        generic.__generic_types__ = args;
        return generic;
    }
}

export class ESTypeUnion extends ESType {

    readonly __left__: Primitive;
    readonly __right__: Primitive;

    constructor (left: Primitive, right: Primitive) {
        super(false, `(${ str(left) }) | (${ str(right) })`);
        this.__left__ = left;
        this.__right__ = right;
    }

    override __call__ = (): Error | Primitive => {
        return new InvalidOperationError('__call__', this);
    }

    override __includes__ = (props: IFuncProps, t: Primitive): ESBoolean | Error => {
        const leftRes = this.__left__.__includes__(props, t);
        const rightRes = this.__right__.__includes__(props, t);
        if (leftRes instanceof Error) return leftRes;
        if (rightRes instanceof Error) return rightRes;

        return new ESBoolean(
            leftRes.__value__ ||
            rightRes.__value__
        );
    }

    override __subtype_of__ = (props: IFuncProps, t: Primitive): ESBoolean | Error => {
        if (Object.is(t, types.any)) {
            return new ESBoolean(true);
        }

        const eqCheckRes = this.__eq__(props, t);
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

    override __eq__ = (props: IFuncProps, t: Primitive): Error | ESBoolean => {
        if (!(t instanceof ESTypeUnion)) return new ESBoolean();

        const leftTypeCheckRes = this.__left__.__eq__(props, t.__left__);
        if (leftTypeCheckRes instanceof Error) return leftTypeCheckRes;

        const rightTypeCheckRes = this.__right__.__eq__(props, t.__right__);
        if (rightTypeCheckRes instanceof Error) return rightTypeCheckRes;

        return new ESBoolean(
            leftTypeCheckRes.__value__ && rightTypeCheckRes.__value__);
    }

    override __generic__ = (): Error | Primitive => {
        return new InvalidOperationError('__generic__', this);
    }
}

export class ESTypeNot extends ESType {
    private readonly __val__: Primitive;

    constructor (type: Primitive) {
        super(false, `~(${ str(type) })`);
        this.__val__ = type;
    }

    override __call__ = (): Error | Primitive => {
        return new InvalidOperationError('__call__', this);
    }

    override __includes__ = (props: IFuncProps, t: Primitive): ESBoolean | Error => {
        const res = this.__val__.__includes__(props, t);
        if (res instanceof Error) return res;

        return new ESBoolean(!res.__value__);
    }

    override __subtype_of__ = (props: IFuncProps, t: Primitive): ESBoolean | Error => {
        if (Object.is(t, types.any)) {
            return new ESBoolean(true);
        }

        /*
            weird case caught here:
            (~Str).__subtype_of__(Str | Num)
            should be false as it could be a string
        */
        if (t instanceof ESTypeUnion || t instanceof ESTypeIntersection) {
            const leftRes = t.__left__.__subtype_of__(props, this.__val__);
            if (leftRes instanceof Error) return leftRes;
            if (leftRes.__value__) return new ESBoolean();

            const rightRes = t.__right__.__subtype_of__(props, this.__val__);
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

    override __eq__ = (props: IFuncProps, t: Primitive) => {
        if (!(t instanceof ESTypeNot)) {
            return new ESBoolean();
        }

        const typeCheckRes = this.__val__.__eq__(props, t.__val__);
        if (typeCheckRes instanceof Error) {
            return typeCheckRes;
        }
        return new ESBoolean(typeCheckRes.__value__ === true);
    }

    override __generic__ = (): Error | Primitive => {
        return new InvalidOperationError('__generic__', this);
    }
}