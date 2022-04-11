import {ESString} from './primitives/string';
import { Primitive } from "../util/util";

export interface ISymbolOptions {
    isConstant?: boolean;
    isAccessible?: boolean;
    global?: boolean;
    forceThroughConst?: boolean;
    type?: Primitive
}

export class ESSymbol {
    isConstant: boolean;
    value: Primitive;
    identifier: string;
    isAccessible: boolean;
    type: Primitive;

    constructor (value: Primitive, identifier: string, options: ISymbolOptions = {}) {
        this.value = value;
        this.identifier = identifier;
        this.isConstant = options.isConstant ?? false;
        this.isAccessible = options.isAccessible ?? true;
        this.type = options.type ?? value.__type__;
    }

    clone = () => {
        return new ESSymbol(this.value.clone(), this.identifier, {
            isConstant: this.isConstant,
            isAccessible: this.isAccessible
        });
    }

    str = () => {
        return new ESString(`<Symbol: ${this.identifier}>`);
    }
}
