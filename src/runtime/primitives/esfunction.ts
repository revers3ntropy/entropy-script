import {ESPrimitive} from './esprimitive';
import { global, types } from '../../util/constants';
import { Error, IndexError } from '../../errors';
import Position from '../../position';
import { BuiltInFunction, funcProps } from '../../util/util';
import {runtimeArgument} from '../argument';
import {Context} from '../context';
import {call} from '../functionCaller';
import {Node} from '../nodes';
import {str} from '../../util/util';
import {ESBoolean} from './esboolean';
import {ESObject} from './esobject';
import {ESString} from './esstring';
import type {Primitive} from './primitive';
import { wrap } from "./wrapStrip";
import { ESTypeIntersection, ESTypeUnion } from "./estype";

export class ESFunction extends ESPrimitive <Node | BuiltInFunction> {
    __args__: runtimeArgument[];
    __this__: ESObject;
    __returns__: Primitive;
    __closure__: Context;
    __allow_args__: boolean;
    __allow_kwargs__: boolean;
    takeCallContextAsClosure: boolean;

    constructor (
        func: Node | BuiltInFunction = (() => {}),
        arguments_: runtimeArgument[] = [],
        name='(anon)',
        this_: ESObject = new ESObject(),
        returnType: Primitive = types.any,
        closure?: Context,
        takeCallContextAsClosure = false,
        allowArgs = false,
        allowKwargs = false
    ) {
        super(func, types.function);
        this.__args__ = arguments_;
        this.__info__.name = name;
        this.__this__ = this_;
        this.__returns__ = returnType;
        if (closure) {
            this.__closure__ = closure;
        } else {
            this.__closure__ = new Context();
            this.__closure__.parent = global;
        }
        this.takeCallContextAsClosure = takeCallContextAsClosure;

        this.__info__.returnType = str(returnType);
        this.__info__.args = arguments_.map(arg => ({
            name: arg.name,
            default_value: str(arg.defaultValue),
            type: arg.type.__info__.name,
            required: true
        }));

        this.__allow_args__ = allowArgs;
        this.__allow_kwargs__ = allowKwargs;
    }

    override cast = (props: funcProps, type: Primitive) => {
        return new Error(Position.void, 'TypeError', `Cannot cast type 'function'`)
    }

    get name () {
        return this.__info__.name ?? '(anonymous)';
    }

    set name (v: string) {
        this.__info__.name = v;
    }

    override clone = (): ESFunction => {
        return new ESFunction(
            this.__value__,
            this.__args__,
            this.name,
            this.__this__,
            this.__returns__,
            this.__closure__
        );
    };

    // @ts-ignore
    override valueOf = () => this;

    override str = () => new ESString(`<Func: ${this.name}>`);

    override __eq__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESFunction))
            return new ESBoolean(false);
        return new ESBoolean(this.__value__ === n.__value__);
    };

    override __bool__ = () => new ESBoolean(true);
    override bool = this.__bool__;

    override __call__ = ({context, kwargs}: funcProps, ...params: Primitive[]): Error | Primitive => {
        let ctx = context;
        if (!this.takeCallContextAsClosure) {
            ctx = this.__closure__;
            ctx.path = context.path;
        }
        return call(ctx, this, params, kwargs);
    }

    override __get__ = (props: funcProps, key: Primitive): Primitive | Error => {
        if (this._.hasOwnProperty(str(key))) {
            return wrap(this._[str(key)], true);
        }
        return new IndexError(Position.void, key.__value__, this);
    };

    override __includes__ = (props: funcProps, n: Primitive): Error | ESBoolean => {
        if (!(n instanceof ESFunction)) {
            return new ESBoolean();
        }

        let nPosArgs = n.__args__.filter(a => !a.isKwarg);
        let thisPosArgs = this.__args__.filter(a => !a.isKwarg);

        if (!this.__allow_args__) {
            if (nPosArgs.length !== thisPosArgs.length) {
                return new ESBoolean();
            }

            for (let i = 0; i < nPosArgs.length; i++) {
                let typeCheckRes = thisPosArgs[i].type.__includes__(props, nPosArgs[i].type);
                if (typeCheckRes instanceof Error) return typeCheckRes;
                if (!typeCheckRes.__value__) {
                    return new ESBoolean();
                }
            }
        }

        if (!this.__allow_kwargs__) {

            let nKwargs = n.__args__.filter(a => a.isKwarg);
            let thisKwargs = this.__args__.filter(a => a.isKwarg);

            if (nKwargs.length !== thisKwargs.length && !this.__allow_kwargs__) {
                return new ESBoolean();
            }

            for (let name of thisKwargs.map(n => n.name)) {
                let nKwarg = nKwargs.find(n => n.name === name);
                if (!nKwarg) return new ESBoolean();

                let typeCheckRes = thisKwargs.find(n => n.name === name)?.type.__includes__(props, nKwarg.type);
                if (typeCheckRes instanceof Error) return typeCheckRes;
                if (!typeCheckRes?.__value__) {
                    return new ESBoolean();
                }
            }
        }

        const thisReturnVal = this.__call__(props);

        if (thisReturnVal instanceof Error) {
            return thisReturnVal;
        }
        let eqRes = thisReturnVal.__eq__(props, n.__returns__);
        if (eqRes instanceof Error) return eqRes;
        return new ESBoolean(eqRes.__value__);
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
}
