import { ESPrimitive } from '../primitive';
import { GLOBAL_CTX, types } from '../../util/constants';
import { Error, IndexError } from '../../errors';
import { BuiltInFunction, IFuncProps, Primitive, str } from '../../util/util';
import { interpretArgument, IRuntimeArgument, IUninterpretedArgument } from '../argument';
import { Context } from '../context';
import { call } from '../functionCaller';
import { Node } from '../nodes';
import { ESBoolean } from './boolean';
import { ESObject } from './object';
import { ESString } from './string';
import { wrap } from "../wrapStrip";
import { ESTypeIntersection } from "./intersection";
import { ESTypeUnion } from "./type";

export class ESFunction extends ESPrimitive <Node | BuiltInFunction> {
    __args__: IUninterpretedArgument[];
    __this__: ESObject;
    __returns__: Primitive;
    __closure__: Context;
    __allow_args__: boolean;
    __allow_kwargs__: boolean;
    takeCallContextAsClosure: boolean;

    constructor (
        func: Node | BuiltInFunction = (() => void 0),
        arguments_: IUninterpretedArgument[] = [],
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
            this.__closure__.parent = GLOBAL_CTX;
        }
        this.takeCallContextAsClosure = takeCallContextAsClosure;

        this.__info__.returnType = str(returnType);

        const interpretedArgs = arguments_.map(a => interpretArgument(a, this.__closure__));
        this.__info__.args = interpretedArgs
            .filter((arg): arg is IRuntimeArgument => !(arg instanceof Error))
            .map(arg => ({
                name: arg.name,
                default_value: str(arg.defaultValue),
                type: arg.type.__info__.name,
                required: true
            }));

        this.__allow_args__ = allowArgs;
        this.__allow_kwargs__ = allowKwargs;
    }

    override cast = () => {
        return new Error('TypeError', `Cannot cast type 'function'`)
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

    override valueOf = () => this;

    override str = () => new ESString(`<Func: ${this.name}>`);

    override __eq__ = (props: IFuncProps, n: Primitive) => {
        if (!(n instanceof ESFunction))
            return new ESBoolean(false);
        return new ESBoolean(this.__value__ === n.__value__);
    };

    override __bool__ = () => new ESBoolean(true);
    override bool = this.__bool__;

    override __call__ = ({ context, kwargs, dontTypeCheck}: IFuncProps, ...params: Primitive[]): Error | Primitive => {
        let ctx = context;
        const oldPath = ctx.path;
        if (!this.takeCallContextAsClosure) {
            ctx = this.__closure__;
            ctx.path = context.path;
        }
        const res = call(ctx, this, params, kwargs, dontTypeCheck);
        ctx.path = oldPath;
        return res;
    }

    override __get__ = (props: IFuncProps, key: Primitive): Primitive | Error => {
        if (str(key) in this) {
            return wrap(this._[str(key)], true);
        }
        return new IndexError(key.__value__, this);
    };

    override __includes__ = (props: IFuncProps, n: Primitive): Error | ESBoolean => {
        if (!(n instanceof ESFunction)) {
            return new ESBoolean();
        }

        const nPosArgs = n.__args__.filter(a => !a.isKwarg);
        const thisPosArgs = this.__args__.filter(a => !a.isKwarg);

        if (!this.__allow_kwargs__ && n.__allow_kwargs__) {
            return new ESBoolean();
        }
        if (!this.__allow_args__ && n.__allow_args__) {
            return new ESBoolean();
        }

        if (!this.__allow_args__) {
            if (nPosArgs.length !== thisPosArgs.length) {
                return new ESBoolean();
            }

            for (let i = 0; i < nPosArgs.length; i++) {
                const { val: typeCheckInterpretResult, error } = thisPosArgs[i].type.interpret(props.context);
                if (error) return error;
                const {val: posArgInterpretResult, error: posArgInterpretError } = nPosArgs[i].type.interpret(props.context);
                if (posArgInterpretError) return posArgInterpretError;
                const typeCheckRes = typeCheckInterpretResult.__subtype_of__(props, posArgInterpretResult);
                if (typeCheckRes instanceof Error) return typeCheckRes;
                if (!typeCheckRes.__value__) {
                    return new ESBoolean();
                }
            }
        }

        if (!this.__allow_kwargs__) {

            const nKwargs = n.__args__.filter(a => a.isKwarg);
            const thisKwargs = this.__args__.filter(a => a.isKwarg);

            if (nKwargs.length !== thisKwargs.length && !this.__allow_kwargs__) {
                return new ESBoolean();
            }

            for (const name of thisKwargs.map(n => n.name)) {
                const nKwarg = nKwargs.find(n => n.name === name);
                if (!nKwarg) {
                    return new ESBoolean();
                }

                const kwargTypeNode = thisKwargs.find(n => n.name === name)?.type;
                if (!kwargTypeNode) {
                    return new ESBoolean();
                }
                const { val: kwargTypeVal, error} = kwargTypeNode.interpret(props.context);
                if (error) return error;

                const { val: nkwargVal, error: nkwargError } = nKwarg.type.interpret(props.context);
                if (nkwargError) return nkwargError;
                const typeCheckRes = kwargTypeVal.__subtype_of__(props, nkwargVal);
                if (typeCheckRes instanceof Error) return typeCheckRes;
                if (!typeCheckRes?.__value__) {
                    return new ESBoolean();
                }
            }
        }

        const thisReturnVal = this.__call__({
            ...props,
            dontTypeCheck: true
        });

        if (thisReturnVal instanceof Error) {
            return thisReturnVal;
        }
        const eqRes = n.__returns__.__subtype_of__(props, thisReturnVal);
        if (eqRes instanceof Error) return eqRes;
        return eqRes.__bool__();
    };

    override __subtype_of__ = (props: IFuncProps, n: Primitive): Error | ESBoolean => {
        if (Object.is(n, types.any) || Object.is(n, types.function)) {
            return new ESBoolean(true);
        }

        if (!(n instanceof ESFunction)) {
            return new ESBoolean();
        }

        const nPosArgs = n.__args__.filter(a => !a.isKwarg);
        const thisPosArgs = this.__args__.filter(a => !a.isKwarg);

        if (!this.__allow_args__) {
            if (nPosArgs.length !== thisPosArgs.length) {
                return new ESBoolean();
            }

            for (let i = 0; i < nPosArgs.length; i++) {
                const { val: typeCheckInterpretResult, error } = thisPosArgs[i].type.interpret(props.context);
                if (error) return error;
                const {val: posArgInterpretResult, error: posArgInterpretError } = nPosArgs[i].type.interpret(props.context);
                if (posArgInterpretError) return posArgInterpretError;
                const typeCheckRes = typeCheckInterpretResult.__subtype_of__(props, posArgInterpretResult);
                if (typeCheckRes instanceof Error) return typeCheckRes;
                if (!typeCheckRes.__value__) {
                    return new ESBoolean();
                }
            }
        }

        if (!this.__allow_kwargs__) {

            const nKwargs = n.__args__.filter(a => a.isKwarg);
            const thisKwargs = this.__args__.filter(a => a.isKwarg);

            if (nKwargs.length !== thisKwargs.length && !this.__allow_kwargs__) {
                return new ESBoolean();
            }

            for (const name of thisKwargs.map(n => n.name)) {
                const nKwarg = nKwargs.find(n => n.name === name);
                if (!nKwarg) return new ESBoolean();

                const kwargTypeNode = thisKwargs.find(n => n.name === name)?.type;
                if (!kwargTypeNode) {
                    return new ESBoolean();
                }
                const { val: kwargTypeVal, error } = kwargTypeNode.interpret(props.context);
                if (error) return error;

                const { val: nkwargVal, error: nkwargError } = nKwarg.type.interpret(props.context);
                if (nkwargError) return nkwargError;
                const typeCheckRes = kwargTypeVal.__subtype_of__(props, nkwargVal);
                if (typeCheckRes instanceof Error) return typeCheckRes;
                if (!typeCheckRes?.__value__) {
                    return new ESBoolean();
                }
            }
        }

        const thisReturnVal = this.__call__({
            ...props,
            dontTypeCheck: true
        });

        if (thisReturnVal instanceof Error) {
            return thisReturnVal;
        }

        const nReturnsVal = n.__call__({
            ...props,
            dontTypeCheck: true
        });
        if (nReturnsVal instanceof Error) return nReturnsVal;

        const eqRes = nReturnsVal.__subtype_of__(props, thisReturnVal);
        if (eqRes instanceof Error) return eqRes;
        return eqRes.__bool__();
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
}
