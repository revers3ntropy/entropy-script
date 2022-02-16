import { ESString } from './primitives/esstring.js';
export class ESSymbol {
    constructor(value, identifier, options = {}) {
        var _a, _b;
        this.clone = () => {
            return new ESSymbol(this.value.clone([]), this.identifier, {
                isConstant: this.isConstant,
                isAccessible: this.isAccessible
            });
        };
        this.str = () => new ESString(`<Symbol: ${this.identifier}>`);
        this.value = value;
        this.identifier = identifier;
        this.isConstant = (_a = options.isConstant) !== null && _a !== void 0 ? _a : false;
        this.isAccessible = (_b = options.isAccessible) !== null && _b !== void 0 ? _b : true;
    }
}
