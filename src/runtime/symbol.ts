import {ESString} from './primitives/esstring.js';
import {Primitive} from './primitives/primitive.js';

export type symbolOptions = {
    isConstant?: boolean;
    isAccessible?: boolean;
    global?: boolean;
    forceThroughConst?: boolean;
}

export class ESSymbol {
    isConstant: boolean;
    value: Primitive;
    identifier: string;
    isAccessible: boolean;

    constructor (value: Primitive, identifier: string, options: symbolOptions = {}) {
        this.value = value;
        this.identifier = identifier;
        this.isConstant = options.isConstant ?? false;
        this.isAccessible = options.isAccessible ?? true;
    }

    clone = () => {
        return new ESSymbol(this.value.clone(), this.identifier, {
            isConstant: this.isConstant,
            isAccessible: this.isAccessible
        });
    }

    str = () => new ESString(`<Symbol: ${this.identifier}>`);
}