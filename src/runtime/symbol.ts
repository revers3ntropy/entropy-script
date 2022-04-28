import {ESString} from './primitives/string';
import { IFuncProps, Primitive } from "../util/util";

export interface ISymbolOptions {
    isConstant?: boolean;
    isAccessible?: boolean;
    global?: boolean;
    forceThroughConst?: boolean;
    type?: Primitive
}

/**
 * A symbol, which holds a primitive and some info about it.
 */
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

    clone = (props: IFuncProps) => {
        return new ESSymbol(this.value.clone(props), this.identifier, {
            isConstant: this.isConstant,
            isAccessible: this.isAccessible
        });
    }

    str = () => {
        return new ESString(`<Symbol: ${this.identifier}>`);
    }
}
