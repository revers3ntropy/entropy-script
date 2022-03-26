import {ESPrimitive} from './esprimitive';
import { global, types } from '../../util/constants';
import { ESError, IndexError } from '../../errors';
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
        return new ESError(Position.void, 'TypeError', `Cannot cast type 'function'`)
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

    override __call__ = ({context, kwargs}: funcProps, ...params: Primitive[]): ESError | Primitive => {
        let ctx = context;
        if (!this.takeCallContextAsClosure) {
            ctx = this.__closure__;
            ctx.path = context.path;
        }
        return call(ctx, this, params, kwargs);
    }

    override __get__ = (props: funcProps, key: Primitive): Primitive | ESError => {
        if (this._.hasOwnProperty(str(key))) {
            return wrap(this._[str(key)], true);
        }
        return new IndexError(Position.void, key.valueOf(), this);
    };

    override type_check = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESFunction)) {
            return new ESBoolean();
        }
        if (this.__args__.length !== n.__args__.length) {
            return new ESBoolean();
        }

        for (let i = 0; i < this.__args__.length; i++) {
            if (!this.__args__[i].type.type_check(props, n.__args__[i].type).valueOf()) {
                return new ESBoolean();
            }
        }

        const thisReturnVal = this.__call__(props);

        if (thisReturnVal instanceof ESError) {
            return thisReturnVal;
        }

        if (!thisReturnVal.__eq__(props, n.__returns__).valueOf()) {
            return new ESBoolean();
        }

        return new ESBoolean(true);

    };

    override __pipe__ (props: funcProps, n: Primitive): Primitive | ESError {
        return new ESTypeUnion(this, n);
    }
    override __ampersand__ (props: funcProps, n: Primitive): Primitive | ESError {
        return new ESTypeIntersection(this, n);
    }
}
