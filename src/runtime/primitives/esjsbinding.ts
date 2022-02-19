import {ESError, IndexError, TypeError} from '../../errors.js';
import {Position} from '../../position.js';
import {ESBoolean} from './esboolean.js';
import {ESString} from './esstring.js';
import {ESPrimitive} from './esprimitive.js';
import { funcProps, str } from '../../util/util.js';
import { Primitive, types } from './primitive.js';
import { strip, wrap } from './wrapStrip.js';
import { ESFunction } from "./esfunction.js";


export class ESJSBinding<T> extends ESPrimitive<T> {
    constructor (value: T, name='<AnonNative>') {
        super(value, types.object);
        this.info.name = str(name);
    }

    isa = ({}, type: Primitive) => {
        return new ESBoolean(type === types.object);
    };

    cast = ({}) => {
        return new ESError(Position.unknown, 'TypeError', `Cannot cast native object`);
    };

    clone = (chain: Primitive[]) => {
        return new ESJSBinding<T>(this.__value__);
    };

    str = (): ESString => {
        try {
            return new ESString(`<NativeObject ${JSON.stringify(this.__value__)}>`);
        } catch (e: any) {
            return new ESString(`<NativeObject ${this.__value__}>`);
        }
    };

    __eq__ = ({}: funcProps, n: Primitive): ESBoolean => {
        return new ESBoolean(this === n);
    };

    __bool__ = () => new ESBoolean(true);
    bool = this.__bool__;

    __getProperty__ = ({}: funcProps, k: Primitive): Primitive | ESError => {
        const key = str(k);

        const val: any = this.valueOf();

        const res = val[key];

        if (res === undefined) {

            // check on self after confirming it doesn't exist on the native value
            const self: any = this;
            if (self.hasOwnProperty(key)) {
                return wrap(self[key]);
            }

            return new IndexError(Position.unknown, key, this);
        }

        if (res instanceof ESPrimitive) {
            return res;
        }

        // preserve this context
        if (typeof res === 'function') {
            return new ESFunction(({context}: funcProps, ...args) => {
                return val[key](...args.map(strip));
            });
        }

        return new ESJSBinding(res);
    };

    __call__ = (props: funcProps, ...args: Primitive[]): ESError | Primitive => {
        if (typeof this.__value__ !== 'function') {
            return new TypeError(Position.unknown, 'function', typeof this.__value__, str(this));
        }

        const res = this.__value__(...args.map(strip));

        if (res instanceof ESPrimitive) {
            return res;
        }

        return new ESJSBinding(res);
    };

    hasProperty = (props: funcProps, key: Primitive): ESBoolean => {
        return new ESBoolean(!(this.__getProperty__(props, key) instanceof ESError));
    };
}
