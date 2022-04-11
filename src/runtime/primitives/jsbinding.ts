import { Error, IndexError, TypeError as ESTypeError } from '../../errors';
import {ESBoolean} from './boolean';
import {ESString} from './string';
import {ESPrimitive} from '../primitive';
import { Map, IFuncProps, Primitive, NativeObj, str } from '../../util/util';
import { strip, wrap } from '../wrapStrip';
import { ESFunction } from "./function";
import { types } from "../../util/constants";
import { ESArray } from "./array";
import { ESErrorPrimitive } from "./error";
import { Iterable } from "./iterable";
import { ESNumber } from './number';
import { ESTypeIntersection } from "./intersection";
import { ESTypeUnion } from "./type";


function tryCall (fTakesProps: boolean, val: any, key: any, props: IFuncProps, args: Primitive[], catchErs: boolean): Primitive | Error {
    if (typeof val[key] !== 'function') {
        return new ESTypeError('Func', typeof val[key], str(val[key]));
    }
    let res;
    if (fTakesProps) {
        try {
            res = new val[key](props, ...args);
        } catch (e: any) {
            if (!(e instanceof TypeError)) {
                return new Error(e.name, e.toString());
            }
            try {
                res = val[key](props, ...args);
            } catch (e: any) {
                return new Error('', e.toString());
            }
        }
    } else {
        try {
            res = new val[key](...args.map(o => strip(o, props)));
        } catch (e: any) {
            if (!(e instanceof TypeError)) {
                return new Error(e.name, e.toString());
            }
            try {
                res = val[key](...args.map(o => strip(o, props)));
            } catch (e: any) {
                return new Error('', e.toString());
            }
        }
    }
    if (res instanceof Error && catchErs) {
        return new ESErrorPrimitive(res);
    }
    return wrap(res);
}


export class ESJSBinding<T = NativeObj> extends ESPrimitive<T> implements Iterable {

    functionsTakeProps: boolean;
    catchErrorsToPrimitive: boolean;
    override __iterable__ = true;

    constructor (value: T, name = '<AnonNative>', functionsTakeProps = false, catchErrors = false) {
        super(value, typeof value === 'function' ? types.function : types.object);
        this.__info__.name = str(name);
        this.functionsTakeProps = functionsTakeProps;
        this.catchErrorsToPrimitive = catchErrors;
    }

    override cast = (): Error | Primitive => {
        return new Error('ESTypeError', `Cannot cast native object`);
    };

    override clone = (): Primitive => new ESJSBinding<T>(this.__value__);

    override str = (props: IFuncProps, depth= new ESNumber): ESString => {
        return new ESString(str(this.__value__, depth.__value__));
    };

    override __eq__ = (props: IFuncProps, n: Primitive): ESBoolean => {
        return new ESBoolean(this === n);
    };

    override __bool__ = (): ESBoolean => new ESBoolean(true);
    override bool = this.__bool__;

    override __get__ = (props: IFuncProps, k: Primitive): Primitive | Error => {
        const key = str(k);

        const val: NativeObj = this.__value__;

        const res = val[key];

        if (res === undefined) {

            // check on self after confirming it doesn't exist on the native value
            if (key in this) {
                return wrap(this._[key], true);
            }

            return new IndexError(key, this);
        }

        if (res instanceof ESPrimitive) {
            return res;
        }

        // preserve this context
        if (typeof res === 'function') {

            const fTakesProps = this.functionsTakeProps;

            const fn = new ESFunction((props, ...args) => {
                return tryCall(fTakesProps, val, key, props, args, this.catchErrorsToPrimitive);
            });

            fn.__allow_kwargs__ = true;
            fn.__allow_args__ = true;

            return fn;
        }

        return wrap(res);
    };

    override __set__ = (props: IFuncProps, k: Primitive, value: Primitive): void | Error => {
        const key = str(k);

        const val: Map<NativeObj> = this.__value__;

        if (key in this) {
            this._[str(key)] = value;
            return;
        }

        val[key] = strip(value, props);
    }

    override __call__ = (props: IFuncProps, ...args: Primitive[]): Error | Primitive => {
        if (typeof this.__value__ !== 'function') {
            return new ESTypeError('function', typeof this.__value__, str(this));
        }

       return tryCall(this.functionsTakeProps, this, '__value__', props, args, this.catchErrorsToPrimitive);
    };

    override has_property = (props: IFuncProps, key: Primitive): ESBoolean => {
        return new ESBoolean(!(this.__get__(props, key) instanceof Error));
    };

    override __includes__ = this.__eq__;
    override __subtype_of__ = (props: IFuncProps, n: Primitive) => {
        if (Object.is(n, types.any) || Object.is(n, types.object)) {
            return new ESBoolean(true);
        }
        return this.__eq__(props, n);
    };

    override __pipe__ = (props: IFuncProps, n: Primitive): Primitive | Error => {
        return new ESTypeUnion(this, n);
    }
    override __ampersand__ = (props: IFuncProps, n: Primitive): Primitive | Error => {
        return new ESTypeIntersection(this, n);
    }

    override __iter__ = (): Error | Primitive => {
        // returns array of keys in the object
        return new ESArray(Object.keys(this.__value__).map(s => new ESString(s)));
    }

    len = () => {
        return new ESNumber(Object.keys(this.__value__).length);
    }

    override keys = () => {
        return [
            ...Object.keys(this),
            ...Object.keys(this.__value__)
        ].map(s => new ESString(s));
    }
}
