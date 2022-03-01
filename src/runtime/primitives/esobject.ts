import {ESError, TypeError} from '../../errors';
import {Position} from '../../position';
import { dict, funcProps, str } from '../../util/util';
import {Context} from '../context';
import {ESArray} from './esarray';
import {ESBoolean} from './esboolean';
import {ESNumber} from './esnumber';
import {ESString} from './esstring';
import {ESType} from './estype';
import {ESPrimitive} from './esprimitive';
import {ESUndefined} from './esundefined';
import { Primitive, types} from './primitive';
import {strip, wrap} from './wrapStrip';
import { ESFunction } from "./esfunction";


export class ESObject extends ESPrimitive <dict<Primitive>> {
    constructor (val: dict<Primitive> = {}) {
        super(val, types.object);
    }

    isa = (props: funcProps, type: Primitive) => {
        if (type === types.object) {
            return new ESBoolean(true);
        }
        if (!(type instanceof ESType)) {
            return new TypeError(Position.unknown, 'TypeError', 'type', str(type.typeName()), str(type));
        }
        return this.__type__.includesType(props, type);
    }

    cast = ({}, type: Primitive) => {
        switch (type) {
            case types.number:
                return new ESNumber(this.valueOf() ? 1 : 0);
            default:
                return new ESError(Position.unknown, 'TypeError', `Cannot cast boolean to type '${str(type.typeName())}'`);
        }
    }

    str = () => {
        let val = str(this.valueOf());
        // remove trailing new line
        if (val[val.length-1] === '\n')
            val = val.substr(0, val.length-1);
        return new ESString(`<ESObject ${val}>`);
    }

    get keys (): ESString[] {
        return Object.keys(this.valueOf()).map(s => new ESString(s));
    }

    set keys (val: ESString[]) {}

    __eq__ = ({context}: {context: Context}, n: Primitive): ESBoolean | ESError => {
        if (!(n instanceof ESObject)) {
            return new ESBoolean();
        }

        if (n.keys.length !== this.keys.length) {
            return new ESBoolean();
        }

        for (let k of this.keys) {
            const key: string = k.valueOf();
            const thisElement = this.valueOf()[key];
            const nElement = n.valueOf()[key];

            if (!thisElement) {
                if (nElement) {
                    // this element is not defined but the other element is
                    return new ESBoolean();
                }
                continue;
            }

            if (!thisElement.__eq__) {
                return new ESBoolean();
            }

            const res = thisElement.__eq__({context}, nElement);
            if (res instanceof ESError) {
                return res;
            }
            if (!res.valueOf()) {
                return new ESBoolean();
            }
        }

        return new ESBoolean(true);
    };

    __bool__ = () => new ESBoolean(true);
    bool = this.__bool__;

    __add__ = ({context}: {context: Context}, n: Primitive) => {

        if (!(n instanceof ESObject)) {
            return new TypeError(Position.unknown, 'object', n.typeName().valueOf(), n);
        }

        let newOb: dict<Primitive> = {};

        for (let k of this.keys) {
            const key = k.valueOf();
            const res = this.__getProperty__({context}, k);
            if (res instanceof ESError) {
                return res;
            }
            newOb[key] = res;
        }

        for (let k of n.keys) {
            const key = k.valueOf();
            if (newOb.hasOwnProperty(key)) {
                continue;
            }
            const res = n.__getProperty__({context}, k);
            if (res instanceof ESError) {
                return res;
            }
            newOb[key] = res;
        }

        return new ESObject(newOb);
    };

    __subtract__ = (props: funcProps, n: Primitive): Primitive | ESError => {

        let keysToRemove = [];
        if (n instanceof ESString) {
            keysToRemove = [str(n)];
        } else if (n instanceof ESArray) {
            keysToRemove = strip(n, props);
        } else {
            return new TypeError(Position.unknown, 'array | string', n.typeName().valueOf(), n);
        }

        if (!Array.isArray(keysToRemove)) {
            return new TypeError(Position.unknown, 'array | string', n.typeName().valueOf(), n);
        }

        let newOb: dict<Primitive> = {};

        for (let k of this.keys) {
            const key = k.valueOf();
            if (keysToRemove.indexOf(key) === -1) {
                let res = this.__getProperty__(props, k);
                if (res instanceof ESError) {
                    return res;
                }
                newOb[key] = res;
            }
        }

        return new ESObject(newOb);
    }

    __getProperty__ = (props: funcProps, k: Primitive): Primitive| ESError => {
        if (!(k instanceof ESString) && !(k instanceof ESNumber)) {
            return new TypeError(Position.unknown, 'string | number', k.typeName(), str(k));
        }

        const key: string | number = k.valueOf();

        if (this.valueOf().hasOwnProperty(key)) {
            return this.valueOf()[key];
        }

        if (this.self.hasOwnProperty(key)) {
            const val = this.self[key];
            if (typeof val === 'function') {
                return new ESFunction(val);
            }
            return wrap(val);
        }

        return new ESUndefined();
    };

    __setProperty__ = ({}: funcProps, key: Primitive, value: Primitive): void | ESError => {
        if (!(key instanceof ESString)) {
            return new TypeError(Position.unknown, 'string', key.typeName(), str(key));
        }
        this.__value__[key.valueOf()] = value;
    }

    hasProperty = (props: funcProps, k: Primitive): ESBoolean => {
        const key = str(k);
        if (this.valueOf().hasOwnProperty(str(key))) {
            return new ESBoolean(true);
        }

        return new ESBoolean(this.hasOwnProperty(key));
    };

    clone = (): ESObject => {

        const res = new ESObject();
        let obj: dict<Primitive> = {};
        let toClone = this.valueOf();

        for (let key of Object.keys(toClone)) {
            obj[key] = toClone[key];
        }

        res.__value__ = obj;

        return res;
    }
}
