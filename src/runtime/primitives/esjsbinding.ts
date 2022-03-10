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
    functionsTakeProps: boolean;
    constructor (value: T, name='<AnonNative>', functionsTakeProps=false) {
        super(value, types.object);
        this.info.name = str(name);
        this.functionsTakeProps = functionsTakeProps;
    }

    override cast = (props: funcProps) => {
        return new ESError(Position.void, 'TypeError', `Cannot cast native object`);
    };

    override clone = () => new ESJSBinding<T>(this.__value__);

    override str = (): ESString => {
        try {
            return new ESString(JSON.stringify(this.__value__));
        } catch (e: any) {
            return new ESString(`${this.__value__}`);
        }
    };

    override __eq__ = ({}: funcProps, n: Primitive): ESBoolean => {
        return new ESBoolean(this === n);
    };

    override __bool__ = () => new ESBoolean(true);
    override bool = this.__bool__;

    override __getProperty__ = (props: funcProps, k: Primitive): Primitive | ESError => {
        const key = str(k);

        const val: T & { [key: string]: NativeObj } = this.valueOf();

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

            let fTakesProps = this.functionsTakeProps;

            return new ESFunction((props: funcProps, ...args) => {
                if (!fTakesProps) {
                    args = args.map(o => strip(o, props));
                    const res = val[key](...args);
                    return wrap(res);
                } else {
                    return val[key](props, ...args);
                }
            });
        }

        return wrap(res);
    };

    override __call__ = (props: funcProps, ...args: Primitive[]): ESError | Primitive => {
        if (typeof this.__value__ !== 'function') {
            return new TypeError(Position.void, 'function', typeof this.__value__, str(this));
        }

        let res;

        if (this.functionsTakeProps) {
            try {
                // @ts-ignore
                res = new this.__value__(props, ...args);
            } catch {
                res = this.__value__(props, ...args);
            }
        } else {
            try {
                // @ts-ignore
                res = new this.__value__(...args.map(o => strip(o, props)));
            } catch {
                res = this.__value__(...args.map(o => strip(o, props)));
            }
        }


        if (res instanceof ESPrimitive) {
            return res;
        }

        return wrap(res);
    };

    override hasProperty = (props: funcProps, key: Primitive): ESBoolean => {
        return new ESBoolean(!(this.__getProperty__(props, key) instanceof ESError));
    };

    override typeCheck = this.__eq__;
}
