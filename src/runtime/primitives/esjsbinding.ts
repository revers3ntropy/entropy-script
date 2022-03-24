import { ESError, IndexError, TypeError } from '../../errors';
import Position from '../../position';
import {ESBoolean} from './esboolean';
import {ESString} from './esstring';
import {ESPrimitive} from './esprimitive';
import { funcProps, str } from '../../util/util';
import type {NativeObj, Primitive} from './primitive';
import { strip, wrap } from './wrapStrip';
import { ESFunction } from "./esfunction";
import { types } from "../../constants";
import { ESTypeIntersection, ESTypeUnion } from "./estype";

function callBack (fTakesProps: boolean, val: any, key: any, props: funcProps, args: Primitive[]): Primitive | ESError {
    let res;
    if (fTakesProps) {
        try {
            // @ts-ignore
            res = new val[key](props, ...args);
        } catch {
            try {
                res = val[key](props, ...args);
            } catch (e: any) {
                return new ESError(Position.void, e.name, e.toString());
            }
        }
    } else {
        try {
            // @ts-ignore
            res = new val[key](...args.map(o => strip(o, props)));
        } catch {
            try {
                res = val[key](...args.map(o => strip(o, props)));
            } catch (e: any) {
                return new ESError(Position.void, e.name, e.toString());
            }
        }
    }
    return wrap(res);
}


export class ESJSBinding<T=NativeObj> extends ESPrimitive<T> {

    functionsTakeProps: boolean;

    constructor (value: T, name='<AnonNative>', functionsTakeProps=false) {
        super(value, types.object);
        this.info.name = str(name);
        this.functionsTakeProps = functionsTakeProps;
    }

    override cast = (props: funcProps): ESError | Primitive => {
        return new ESError(Position.void, 'TypeError', `Cannot cast native object`);
    };

    override clone = (): Primitive => new ESJSBinding<T>(this.__value__);

    override str = (): ESString => {
        return new ESString(str(this.__value__));
    };

    override __eq__ = ({}: funcProps, n: Primitive): ESBoolean => {
        return new ESBoolean(this === n);
    };

    override __bool__ = (): ESBoolean => new ESBoolean(true);
    override bool = this.__bool__;

    override __get_property__ = (props: funcProps, k: Primitive): Primitive | ESError => {
        const key = str(k);

        const val: any = this.__value__;

        const res = val[key];

        if (res === undefined) {

            // check on self after confirming it doesn't exist on the native value
            if (this.self.hasOwnProperty(key)) {
                return wrap(this.self[str(key)], true);
            }

            return new IndexError(Position.void, key, this);
        }

        if (res instanceof ESPrimitive) {
            return res;
        }

        // preserve this context
        if (typeof res === 'function') {

            const fTakesProps = this.functionsTakeProps;

            return new ESFunction((props, ...args) => {
                return callBack(fTakesProps, val, key, props, args);
            });
        }

        return wrap(res);
    };

    override __set_property__ (props: funcProps, k: Primitive, value: Primitive): void | ESError {
        const key = str(k);

        const val: { [key: string]: NativeObj } = this.__value__;

        if (this.self.hasOwnProperty(key)) {
            this.self[str(key)] = value;
            return;
        }

        val[key] = strip(value, props);
    }

    override __call__ = (props: funcProps, ...args: Primitive[]): ESError | Primitive => {
        if (typeof this.__value__ !== 'function') {
            return new TypeError(Position.void, 'function', typeof this.__value__, str(this));
        }

       return callBack(this.functionsTakeProps, this, '__value__', props, args);
    };

    override has_property = (props: funcProps, key: Primitive): ESBoolean => {
        return new ESBoolean(!(this.__get_property__(props, key) instanceof ESError));
    };

    override type_check = this.__eq__;

    override __pipe__ (props: funcProps, n: Primitive): Primitive | ESError {
        return new ESTypeUnion(this, n);
    }
    override __ampersand__ (props: funcProps, n: Primitive): Primitive | ESError {
        return new ESTypeIntersection(this, n);
    }
}
