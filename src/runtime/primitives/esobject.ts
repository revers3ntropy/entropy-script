import {ESError, TypeError} from '../../errors.js';
import {Position} from '../../position.js';
import {dict, str} from '../../util/util.js';
import {Context} from '../context.js';
import {ESArray} from './esarray.js';
import {ESBoolean} from './esboolean.js';
import {ESNumber} from './esnumber.js';
import {ESString} from './esstring.js';
import {ESType} from './estype.js';
import {ESPrimitive} from './esprimitive.js';
import {ESUndefined} from './esundefined.js';
import {Primitive, types} from './primitive.js';
import {strip, wrap} from './wrapStrip.js';

export class ESObject extends ESPrimitive <dict<Primitive>> {
    constructor (val: dict<Primitive> = {}) {
        super(val, types.object);
    }

    isa = ({context}: {context: Context}, type: Primitive) => {
        if (type === types.object) {
            return new ESBoolean(true);
        }
        if (!(type instanceof ESType)) {
            return new TypeError(Position.unknown, 'TypeError', 'type', str(type.typeName()), str(type));
        }
        return this.__type__.includesType({context}, type);
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

        let newOb: dict<ESPrimitive<any>> = {};

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

    __subtract__ = ({context}: { context: Context }, n: Primitive): Primitive | ESError => {

        let keysToRemove = [];
        if (n instanceof ESString) {
            keysToRemove = [str(n)];
        } else if (n instanceof ESArray) {
            keysToRemove = strip(n);
        } else {
            return new TypeError(Position.unknown, 'array | string', n.typeName().valueOf(), n);
        }

        if (!Array.isArray(keysToRemove)) {
            return new TypeError(Position.unknown, 'array | string', n.typeName().valueOf(), n);
        }

        let newOb: dict<ESPrimitive<any>> = {};

        for (let k of this.keys) {
            const key = k.valueOf();
            if (keysToRemove.indexOf(key) === -1) {
                let res = this.__getProperty__({context}, k);
                if (res instanceof ESError) {
                    return res;
                }
                newOb[key] = res;
            }
        }

        return new ESObject(newOb);
    }

    __getProperty__ = ({}: {context: Context}, k: Primitive): Primitive| ESError => {
        if (!(k instanceof ESString)) {
            return new TypeError(Position.unknown, 'string', k.typeName(), str(k));
        }

        const key: string = k.valueOf();

        if (this.valueOf().hasOwnProperty(key)) {
            return this.valueOf()[key];
        }

        if (this.self.hasOwnProperty(key)) {
            return wrap(this.self[key]);
        }

        return new ESUndefined();
    };

    __setProperty__({}: {context: Context}, key: Primitive, value: Primitive): void | ESError {
        if (!(key instanceof ESString)) {
            return new TypeError(Position.unknown, 'string', key.typeName(), str(key));
        }
        this.__value__[key.valueOf()] = value;
    }

    clone = (chain: Primitive[]): ESObject => {
        let obj: dict<Primitive> = {};
        let toClone = this.valueOf();
        for (let key in toClone) {
            try {
                obj[key] = toClone[key].clone(chain);
            } catch (e) {
                throw Error(`Couldn't clone ${str(toClone[key])} from ${this.info}`);
            }
        }
        return new ESObject(obj);
    }
}
