import { ESError, IndexError, TypeError } from '../../errors';
import Position from '../../position';
import { dict, funcProps, str } from '../../util/util';
import {Context} from '../context';
import {ESArray} from './esarray';
import {ESBoolean} from './esboolean';
import {ESNumber} from './esnumber';
import {ESString} from './esstring';
import {ESPrimitive} from './esprimitive';
import type { Primitive} from './primitive';
import {strip, wrap} from './wrapStrip';
import { types } from "../../util/constants.js";
import { ESTypeIntersection, ESTypeUnion } from "./estype";

export class ESObject extends ESPrimitive <dict<Primitive>> {

    constructor (val: dict<Primitive> = {}) {
        super(val, types.object);
    }

    override cast = ({}, type: Primitive) => {
        switch (type) {
            case types.number:
                return new ESNumber(this.valueOf() ? 1 : 0);
            default:
                return new ESError(Position.void, 'TypeError', `Cannot cast boolean to type '${str(type.typeName())}'`);
        }
    }

    override str = () => {
        let val = str(this.valueOf());
        // remove trailing new line
        if (val[val.length-1] === '\n') {
            val = val.substr(0, val.length-1);
        }
        return new ESString(val);
    }

    get keys (): ESString[] {
        return Object.keys(this.valueOf()).map(s => new ESString(s));
    }

    set keys (val: ESString[]) {}

    override __eq__ = ({context}: {context: Context}, n: Primitive): ESBoolean | ESError => {
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

    override __bool__ = () => new ESBoolean(true);
    override bool = this.__bool__;

    override __add__ = ({context}: {context: Context}, n: Primitive) => {

        if (!(n instanceof ESObject)) {
            return new TypeError(Position.void, 'Object', n.typeName().valueOf(), n);
        }

        let newOb: dict<Primitive> = {};

        for (let k of this.keys) {
            const key = k.valueOf();
            const res = this.__get_property__({context}, k);
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
            const res = n.__get_property__({context}, k);
            if (res instanceof ESError) {
                return res;
            }
            newOb[key] = res;
        }

        return new ESObject(newOb);
    };

    override __subtract__ = (props: funcProps, n: Primitive): Primitive | ESError => {

        let keysToRemove = [];
        if (n instanceof ESString) {
            keysToRemove = [str(n)];
        } else if (n instanceof ESArray) {
            keysToRemove = strip(n, props);
        } else {
            return new TypeError(Position.void, 'Array | String', n.typeName().valueOf(), n);
        }

        if (!Array.isArray(keysToRemove)) {
            return new TypeError(Position.void, 'Array | String', n.typeName().valueOf(), n);
        }

        let newOb: dict<Primitive> = {};

        for (let k of this.keys) {
            const key = k.valueOf();
            if (keysToRemove.indexOf(key) === -1) {
                let res = this.__get_property__(props, k);
                if (res instanceof ESError) {
                    return res;
                }
                newOb[key] = res;
            }
        }

        return new ESObject(newOb);
    }

    override __get_property__ = (props: funcProps, k: Primitive): Primitive| ESError => {
        if (!(k instanceof ESString) && !(k instanceof ESNumber)) {
            return new TypeError(Position.void, 'String | Number', k.typeName(), str(k));
        }

        const key: string | number = k.valueOf();

        if (this.valueOf().hasOwnProperty(key)) {
            return this.valueOf()[key];
        }

        if (this.self.hasOwnProperty(key)) {
            return wrap(this.self[str(key)], true);
        }

        return new IndexError(Position.void, str(key), this);
    };

    override __set_property__ = ({}: funcProps, key: Primitive, value: Primitive): void | ESError => {
        if (!(key instanceof ESString)) {
            return new TypeError(Position.void, 'String', key.typeName(), str(key));
        }
        this.__value__[key.valueOf()] = value;
    }

    override has_property = (props: funcProps, k: Primitive): ESBoolean => {
        const key = str(k);
        if (this.valueOf().hasOwnProperty(str(key))) {
            return new ESBoolean(true);
        }

        return new ESBoolean(this.hasOwnProperty(key));
    };

    override clone = (): ESObject => {

        const res = new ESObject();
        let obj: dict<Primitive> = {};
        let toClone = this.valueOf();

        for (let key of Object.keys(toClone)) {
            obj[key] = toClone[key];
        }

        res.__value__ = obj;

        return res;
    }

    override type_check = (props: funcProps, n: Primitive): ESBoolean | ESError => {
        if (!(n instanceof ESObject)) {
            return new ESBoolean();
        }

        if (Object.keys(this.valueOf()).length !== Object.keys(n.valueOf()).length) {
            return new ESBoolean();
        }

        for (let key of Object.keys(this.valueOf())) {
            if (!n.valueOf().hasOwnProperty(key) || !this.valueOf().hasOwnProperty(key)) {
                return new ESBoolean();
            }
            const thisType = this.valueOf()[key];
            const nValue = n.valueOf()[key];

            if (!thisType.type_check(props, nValue).valueOf()) {
                return new ESBoolean();
            }
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
