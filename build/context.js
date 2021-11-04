import { initialise } from "./init.js";
import { ESError, TypeError } from "./errors.js";
import { Position } from "./position.js";
import { ESArray, ESPrimitive, ESType, ESUndefined, types } from "./primitiveTypes.js";
import { str } from "./util.js";
export class ESSymbol {
    constructor(value, identifier, options = {}) {
        var _a, _b;
        this.value = value;
        this.identifier = identifier;
        this.isConstant = (_a = options.isConstant) !== null && _a !== void 0 ? _a : false;
        this.isAccessible = (_b = options.isAccessible) !== null && _b !== void 0 ? _b : true;
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
        if (!(value instanceof ESPrimitive))
            value = ESPrimitive.wrap(value);
        // is not global
        if (options.global && !this.initialisedAsGlobal)
            options.global = false;
        if (!options.forceThroughConst) {
            let symbol = this.symbolTable[identifier];
            if (symbol === null || symbol === void 0 ? void 0 : symbol.isConstant)
                return new TypeError(Position.unknown, 'dynamic', 'constant', identifier);
        }
        this.symbolTable[identifier] = new ESSymbol(value, identifier, options);
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
        var _a, _b;
        if (!this.initialisedAsGlobal)
            return;
        const printFunc = this.root.get('print');
        const inputFunc = this.root.get('input');
        if (!(printFunc instanceof ESPrimitive) || !(inputFunc instanceof ESPrimitive)) {
            console.error('Error with print and input functions.');
            return;
        }
        this.symbolTable = {};
        this.initialisedAsGlobal = false;
        initialise(this, ((_a = printFunc.valueOf()) === null || _a === void 0 ? void 0 : _a.func) || console.log, ((_b = inputFunc.valueOf()) === null || _b === void 0 ? void 0 : _b.func) || (() => { }), this.libs);
    }
    log() {
        console.log('---- CONTEXT ----');
        for (let key in this.symbolTable) {
            const symbol = this.symbolTable[key];
            let out = key;
            if (symbol.isConstant)
                out += ' (CONST)';
            if (!symbol.isAccessible)
                out += ' (INACCESSIBLE)';
            out += ': ';
            out += str(this.symbolTable[key].value);
            console.log(out);
        }
        console.log('-----------------');
    }
}
export function generateESFunctionCallContext(params, self, parent) {
    const newContext = new Context();
    newContext.parent = parent;
    let max = Math.max(params.length, self.arguments_.length);
    for (let i = 0; i < max; i++) {
        let value = new ESUndefined();
        let type = types.any;
        if (self.arguments_[i] == undefined)
            continue;
        // __type__ checking
        const arg = self.arguments_[i];
        if (!(arg.type instanceof ESType))
            return new TypeError(Position.unknown, 'Type', typeof arg.type, arg.type);
        if (params[i] instanceof ESPrimitive) {
            type = params[i].__type__;
            value = params[i];
        }
        if (!arg.type.includesType(type))
            return new TypeError(Position.unknown, arg.type.__name__, type.__name__);
        newContext.setOwn(value, arg.name, {
            forceThroughConst: true
        });
    }
    let setRes = newContext.setOwn(new ESArray(params), 'args');
    if (setRes instanceof ESError)
        return setRes;
    return newContext;
}
