import {ESError, IndexError, TypeError} from '../../errors';
import {Position} from '../../position';
import {dict} from '../../util/util';
import {Context} from '../context';
import {ESSymbol} from '../symbol';
import {ESBoolean} from './esboolean';
import {ESString} from './esstring';
import {ESPrimitive} from './esprimitive';
import {str} from '../../util/util';
import {Primitive, types} from './primitive';
import {wrap} from './wrapStrip';
import { ESFunction } from "./esfunction";


export class ESNamespace extends ESPrimitive<dict<ESSymbol>> {
    public mutable: boolean;

    constructor (name: ESString, value: dict<ESSymbol>, mutable=false) {
        super(value, types.object);
        this.info.name = str(name);
        this.mutable = mutable;
    }

    cast = ({}) => {
        return new ESError(Position.unknown, 'TypeError', `Cannot cast type 'namespace'`);
    }

    get name () {
        return new ESString(this.info.name);
    }

    set name (v: ESString) {
        this.info.name = v.valueOf();
    }

    clone = (): Primitive => {
        let obj: dict<ESSymbol> = {};
        let toClone = this.valueOf();
        for (let key of Object.keys(toClone)) {
            obj[key] = toClone[key];
        }
        return new ESNamespace(this.name, obj);
    }

    str = (): ESString => {
        const keys = Object.keys(this.valueOf());
        return new ESString(`<Namespace ${str(this.name)}${keys.length > 0 ? ': ' : ''}${keys.slice(0, 5)}${keys.length >= 5 ? '...' : ''}>`);
    }

    __eq__ = ({}: {context: Context}, n: Primitive): ESBoolean => {
        return new ESBoolean(this === n);
    };

    __bool__ = () => new ESBoolean(true);
    bool = this.__bool__;


    __getProperty__ = ({}: {context: Context}, key: Primitive): Primitive | ESError => {
        if (key instanceof ESString && this.valueOf().hasOwnProperty(key.valueOf())) {
            const symbol = this.valueOf()[key.valueOf()];
            if (symbol.isAccessible) {
                return symbol.value;
            }
        }

        if (!(key instanceof ESString)) {
            return new TypeError(Position.unknown, 'string', key.typeName());
        }

        if (this.self.hasOwnProperty(str(key))) {
            const val = this.self[str(key)];
            if (typeof val === 'function') {
                return new ESFunction(val);
            }
            return wrap(val);
        }

        return new IndexError(Position.unknown, key.valueOf(), this.self);
    };

    __setProperty__({}: {context: Context}, key: Primitive, value: Primitive): void | ESError {
        if (!(key instanceof ESString)) {
            return new TypeError(Position.unknown, 'string', key.typeName().valueOf(), str(key));
        }

        let idx = str(key);

        if (!this.mutable) {
            return new TypeError(Position.unknown, 'mutable', 'immutable', `${str(this.name)}`);
        }

        if (!(value instanceof ESPrimitive)) {
            value = wrap(value);
        }

        const symbol = this.__value__[idx];
        if (!symbol) {
            return new ESError(Position.unknown, 'SymbolError', `Symbol ${idx} is not declared in namespace ${str(this.name)}.`);
        }
        if (symbol.isConstant) {
            return new TypeError(Position.unknown, 'mutable', 'immutable', `${str(this.name)}.${idx}`);
        }
        if (!symbol.isAccessible) {
            return new TypeError(Position.unknown, 'accessible', 'inaccessible', `${str(this.name)}.${idx}`);
        }

        symbol.value = value;
    }
}
