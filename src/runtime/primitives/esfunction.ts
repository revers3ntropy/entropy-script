import {ESPrimitive} from './esprimitive';
import {global} from '../../constants';
import { ESError, IndexError } from '../../errors';
import {Position} from '../../position';
import { BuiltInFunction, funcProps } from '../../util/util';
import {runtimeArgument} from '../argument';
import {Context} from '../context';
import {call} from '../functionCaller';
import {Node} from '../nodes';
import {str} from '../../util/util';
import {ESBoolean} from './esboolean';
import {ESObject} from './esobject';
import {ESString} from './esstring';
import {ESType} from './estype';
import {Primitive, types} from './primitive';
import { wrap } from "./wrapStrip";

export class ESFunction extends ESPrimitive <Node | BuiltInFunction> {
    arguments_: runtimeArgument[];
    this_: ESObject;
    returnType: ESType;
    __closure__: Context;

    constructor (
        func: Node | BuiltInFunction = (() => {}),
        arguments_: runtimeArgument[] = [],
        name='(anon)',
        this_: ESObject = new ESObject(),
        returnType = types.any,
        closure?: Context
    ) {
        super(func, types.function);
        this.arguments_ = arguments_;
        this.info.name = name;
        this.this_ = this_;
        this.returnType = returnType;
        if (closure) {
            this.__closure__ = closure;
        } else {
            this.__closure__ = new Context();
            this.__closure__.parent = global;
        }

        this.info.returnType = str(returnType);
        this.info.args = arguments_.map(arg => ({
            name: arg.name,
            defaultValue: str(arg.defaultValue),
            type: arg.type.info.name,
            required: true
        }));
        // TODO: info.helpLink
    }

    override cast = (props: funcProps, type: Primitive) => {
        return new ESError(Position.void, 'TypeError', `Cannot cast type 'function'`)
    }

    get name () {
        return this.info.name ?? '(anonymous)';
    }

    set name (v: string) {
        this.info.name = v;
    }

    clone = (): ESFunction => {
        return new ESFunction(
            this.__value__,
            this.arguments_,
            this.name,
            this.this_,
            this.returnType,
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

    override __call__ = ({context}: funcProps, ...params: Primitive[]): ESError | Primitive => {
        this.__closure__.path = context.path;
        return call(this.__closure__, this, params);
    }

    override __getProperty__ = (props: funcProps, key: Primitive): Primitive | ESError => {
        if (this.self.hasOwnProperty(str(key))) {
            return wrap(this.self[str(key)], true);
        }
        return new IndexError(Position.void, key.valueOf(), this);
    };
}
