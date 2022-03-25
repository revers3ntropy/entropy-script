import {ESError, IndexError, TypeError} from '../../errors';
import Position from '../../position';
import { dict, funcProps } from '../../util/util';
import {ESSymbol} from '../symbol';
import {ESBoolean} from './esboolean';
import {ESString} from './esstring';
import {ESPrimitive} from './esprimitive';
import {str} from '../../util/util';
import type {Primitive} from './primitive';
import {wrap} from './wrapStrip';
import { types } from "../../util/constants.js";
import { ESTypeIntersection, ESTypeUnion } from "./estype";

export class ESNamespace extends ESPrimitive<dict<ESSymbol>> {
    public mutable: boolean;

    constructor (name: ESString, value: dict<ESSymbol>, mutable=false) {
        super(value, types.object);
        this.info.name = str(name);
        this.mutable = mutable;
    }

    override cast = (props: funcProps) => {
        return new ESError(Position.void, 'TypeError', `Cannot cast type 'namespace'`);
    }

    get name () {
        return new ESString(this.info.name);
    }

    set name (v: ESString) {
        this.info.name = v.valueOf();
    }

    override clone = (): Primitive => {
        let obj: dict<ESSymbol> = {};
        let toClone = this.valueOf();
        for (let key of Object.keys(toClone)) {
            obj[key] = toClone[key];
        }
        return new ESNamespace(this.name, obj);
    }

    override str = (): ESString => {
        const keys = Object.keys(this.valueOf());
        return new ESString(`<Namespace ${str(this.name)}${keys.length > 0 ? ': ' : ''}${keys.slice(0, 5)}${keys.length >= 5 ? '...' : ''}>`);
    }

    override __eq__ = (props: funcProps, n: Primitive): ESBoolean => {
        return new ESBoolean(this === n);
    };

    override __bool__ = () => new ESBoolean(true);
    override bool = this.__bool__;


    override __get_property__ = (props: funcProps, key: Primitive): Primitive | ESError => {
        if (key instanceof ESString && this.valueOf().hasOwnProperty(key.valueOf())) {
            const symbol = this.valueOf()[key.valueOf()];
            if (symbol.isAccessible) {
                return symbol.value;
            }
        }

        if (!(key instanceof ESString)) {
            return new TypeError(Position.void, 'string', key.typeName());
        }

        if (this.self.hasOwnProperty(str(key))) {
            return wrap(this.self[str(key)], true);
        }

        return new IndexError(Position.void, key.valueOf(), this.self);
    };

    override __set_property__(props: funcProps, key: Primitive, value: Primitive): void | ESError {
        if (!(key instanceof ESString)) {
            return new TypeError(Position.void, 'string', key.typeName().valueOf(), str(key));
        }

        let idx = str(key);

        if (!this.mutable) {
            return new TypeError(Position.void, 'mutable', 'immutable', `${str(this.name)}`);
        }

        if (!(value instanceof ESPrimitive)) {
            value = wrap(value);
        }

        const symbol = this.__value__[idx];
        if (!symbol) {
            return new ESError(Position.void, 'SymbolError', `Symbol ${idx} is not declared in namespace ${str(this.name)}.`);
        }
        if (symbol.isConstant) {
            return new TypeError(Position.void, 'mutable', 'immutable', `${str(this.name)}[${idx}]`);
        }
        if (!symbol.isAccessible) {
            return new TypeError(Position.void, 'accessible', 'inaccessible', `${str(this.name)}[${idx}]`);
        }

        symbol.value = value;
    }

    override type_check = this.__eq__;

    override __pipe__ (props: funcProps, n: Primitive): Primitive | ESError {
        return new ESTypeUnion(this, n);
    }
    override __ampersand__ (props: funcProps, n: Primitive): Primitive | ESError {
        return new ESTypeIntersection(this, n);
    }
}
