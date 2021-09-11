import { initialise } from "./init.js";
import { ESError, TypeError } from "./errors.js";
import { Position } from "./position.js";
import { ESType } from "./type.js";
export class ESSymbol {
    constructor(value, identifier, options = {}) {
        var _a, _b, _c;
        this.value = value;
        this.identifier = identifier;
        this.isConstant = (_a = options.isConstant) !== null && _a !== void 0 ? _a : false;
        this.isAccessible = (_b = options.isAccessible) !== null && _b !== void 0 ? _b : true;
        this.type = (_c = options.type) !== null && _c !== void 0 ? _c : ESType.any;
    }
}
export class Context {
    constructor() {
        this.initialisedAsGlobal = false;
        this.libs = [];
        this.deleted = false;
        this.symbolTable = {};
    }
    has(identifier) {
        return this.get(identifier) !== undefined;
    }
    hasOwn(identifier) {
        return this.symbolTable[identifier] instanceof ESSymbol;
    }
    get(identifier) {
        let symbol = this.getSymbol(identifier);
        if (symbol instanceof ESError || symbol == undefined)
            return symbol;
        return symbol.value;
    }
    getSymbol(identifier) {
        let symbol = this.symbolTable[identifier];
        if (symbol !== undefined && !symbol.isAccessible)
            return new TypeError(Position.unknown, 'assessable', 'inaccessible', symbol.identifier);
        if (symbol === undefined && this.parent) {
            let res = this.parent.getSymbol(identifier);
            if (res instanceof ESError)
                return res;
            symbol = res;
        }
        return symbol;
    }
    set(identifier, value, options = {}) {
        let context = this;
        if (options.global) {
            context = this.root;
        }
        else {
            // searches upwards to find the identifier, and if none can be found then it assigns it to the current context
            while (!context.hasOwn(identifier) && context.parent !== undefined) {
                context = context.parent;
            }
            if (!context.hasOwn(identifier))
                context = this;
        }
        return context.setOwn(value, identifier, options);
    }
    setOwn(value, identifier, options = {}) {
        // is not global
        if (options.global && !this.initialisedAsGlobal)
            options.global = false;
        let symbol = this.getSymbol(identifier);
        if (symbol instanceof ESError)
            return symbol;
        if (symbol === null || symbol === void 0 ? void 0 : symbol.isConstant) {
            return new TypeError(Position.unknown, 'dynamic', 'constant', identifier);
        }
        this.symbolTable[identifier] = new ESSymbol(value, identifier, options);
        return value;
    }
    remove(identifier) {
        delete this.symbolTable[identifier];
    }
    clear() {
        for (let symbol in this.symbolTable)
            this.remove(symbol);
        this.parent = undefined;
        this.deleted = true;
    }
    get root() {
        let parent = this;
        while (parent.parent)
            parent = parent.parent;
        return parent;
    }
    resetAsGlobal() {
        if (!this.initialisedAsGlobal)
            return;
        const printFunc = this.root.get('print');
        const inputFunc = this.root.get('input');
        this.symbolTable = {};
        this.initialisedAsGlobal = false;
        initialise(this, (printFunc === null || printFunc === void 0 ? void 0 : printFunc.func) || console.log, (inputFunc === null || inputFunc === void 0 ? void 0 : inputFunc.func) || (() => { }), this.libs);
    }
}
