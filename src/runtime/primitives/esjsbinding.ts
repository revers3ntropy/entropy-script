import {ESError, IndexError, TypeError} from '../../errors';
import {Position} from '../../position';
import {ESBoolean} from './esboolean';
import {ESString} from './esstring';
import {ESPrimitive} from './esprimitive';
import { funcProps, str } from '../../util/util';
import {NativeObj, Primitive, types} from './primitive';
import { strip, wrap } from './wrapStrip';
import { ESFunction } from "./esfunction";


export class ESJSBinding<T=NativeObj> extends ESPrimitive<T> {
    constructor (value: T, name='<AnonNative>', functionsTakeProps=false) {
        super(value, types.object);
        this.info.name = str(name);
    }

    cast = ({}) => {
        return new ESError(Position.unknown, 'TypeError', `Cannot cast native object`);
    };

    clone = () => new ESJSBinding<T>(this.__value__);

    str = (): ESString => {
        try {
            return new ESString(JSON.stringify(this.__value__));
        } catch (e: any) {
            return new ESString(`${this.__value__}`);
        }
    };

    __eq__ = ({}: funcProps, n: Primitive): ESBoolean => {
        return new ESBoolean(this === n);
    };

    __bool__ = () => new ESBoolean(true);
    bool = this.__bool__;

    __getProperty__ = (props: funcProps, k: Primitive): Primitive | ESError => {
        const key = str(k);

        const val: T & { [key: string]: NativeObj } = this.valueOf();

        const res = val[key];

        if (res === undefined) {

            // check on self after confirming it doesn't exist on the native value
            if (this.self.hasOwnProperty(key)) {
                const val = this.self[str(key)];
                if (typeof val === 'function') {
                    return new ESFunction(val);
                }
                return wrap(val);
            }

            return new IndexError(Position.unknown, key, this);
        }

        if (res instanceof ESPrimitive) {
            return res;
        }

        // preserve this context
        if (typeof res === 'function') {
            return new ESFunction(({context}: funcProps, ...args) => {
                args = args.map(o => strip(o, props));
                const res = val[key](...args);
                return wrap(res);
            });
        }

        return wrap(res);
    };

    __call__ = (props: funcProps, ...args: Primitive[]): ESError | Primitive => {
        if (typeof this.__value__ !== 'function') {
            return new TypeError(Position.unknown, 'function', typeof this.__value__, str(this));
        }

        let res;

        try {
            // @ts-ignore
            res = new this.__value__(...args.map(o => strip(o, props)));
        } catch {
            res = this.__value__(...args.map(o => strip(o, props)));
        }

        if (res instanceof ESPrimitive) {
            return res;
        }

        return wrap(res);
    };

    hasProperty = (props: funcProps, key: Primitive): ESBoolean => {
        return new ESBoolean(!(this.__getProperty__(props, key) instanceof ESError));
    };
}
