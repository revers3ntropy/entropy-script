import {ESString} from './primitives/esstring';
import type {Primitive} from './primitives/primitive';
import type { ESType } from "./primitives/estype";
import { types } from "./primitives/primitive";

export type symbolOptions = {
    isConstant?: boolean;
    isAccessible?: boolean;
    global?: boolean;
    forceThroughConst?: boolean;
    type?: ESType
}

export class ESSymbol {
    isConstant: boolean;
    value: Primitive;
    identifier: string;
    isAccessible: boolean;
    type: ESType;

    constructor (value: Primitive, identifier: string, options: symbolOptions = {}) {
        this.value = value;
        this.identifier = identifier;
        this.isConstant = options.isConstant ?? false;
        this.isAccessible = options.isAccessible ?? true;
        this.type = options.type ?? types.any;
    }

    clone = () => {
        return new ESSymbol(this.value.clone(), this.identifier, {
            isConstant: this.isConstant,
            isAccessible: this.isAccessible
        });
    }

    str = () => new ESString(`<Symbol: ${this.identifier}>`);
}