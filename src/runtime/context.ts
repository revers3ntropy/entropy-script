import { initialise } from "../init.js";
import { ESError, TypeError } from "../errors.js";
import { Position } from "../position.js";
import {ESArray, ESFunction, ESPrimitive, ESString, ESType, ESUndefined, Primitive, types} from "./primitiveTypes.js";
import {dict, str} from "../util/util.js";

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

export class Context {
    private symbolTable: {[identifier: string]: ESSymbol};
    parent_: Context | undefined;
    initialisedAsGlobal = false;
    libs: string[] = [];
    deleted = false;

    constructor () {
        this.symbolTable = {};
    }

    get parent () {
        return this.parent_;
    }
    set parent (val: Context | undefined) {
        if (val == this) {
            console.log('Setting context parent to self'.red);
            return;
        }
        this.parent_ = val;
    }
    has (identifier: string): boolean {
        return this.get(identifier) !== undefined;
    }

    hasOwn (identifier: string): boolean {
        return this.symbolTable[identifier] instanceof ESSymbol;
    }

    get (identifier: string): Primitive | ESError | undefined {
        let symbol = this.getSymbol(identifier);
        if (symbol instanceof ESError || symbol == undefined) return symbol;
        return symbol.value;
    }

    getRawSymbolTableAsDict (): dict<Primitive> {
        const symbols: dict<Primitive> = {};

        for (let key in this.symbolTable)
            symbols[key] = this.symbolTable[key].value;

        return symbols;
    }

    getSymbolTableAsDict (): dict<ESSymbol> {
        const symbols: dict<ESSymbol> = {};

        for (let key in this.symbolTable)
            symbols[key] = this.symbolTable[key];

        return symbols;
    }

    getSymbol (identifier: string): undefined | ESSymbol | ESError {
        let symbol = this.symbolTable[identifier];

        if (symbol !== undefined && !symbol.isAccessible)
            return new TypeError(
                Position.unknown,
                'assessable',
                'inaccessible',
                symbol.identifier
            );

        if (symbol === undefined && this.parent) {
            let res: any = this.parent.getSymbol(identifier);
            if (res instanceof ESError)
                return res;
            symbol = res;
        }

        return symbol;
    }

    set (identifier: string, value: Primitive, options: symbolOptions = {}) {
        let context: Context = this;

        if (options.global) {
            context = this.root;
        } else {
            // searches upwards to find the identifier, and if none can be found then it assigns it to the current context
            while (!context.hasOwn(identifier) && context.parent !== undefined)
                context = context.parent;

            if (!context.hasOwn(identifier))
                context = this;
        }
        return context.setOwn(identifier, value, options);
    }

    setOwn (identifier: string, value: Primitive, options: symbolOptions = {}): void | ESError {

        if (!(value instanceof ESPrimitive))
            value = ESPrimitive.wrap(value);

        // is not global
        if (options.global && !this.initialisedAsGlobal)
            options.global = false;

        if (!options.forceThroughConst) {
            let symbol = this.symbolTable[identifier];
            if (symbol?.isConstant)
                return new TypeError(
                    Position.unknown,
                    'dynamic',
                    'constant',
                    identifier
                );
        }

        this.symbolTable[identifier] = new ESSymbol(value, identifier, options);
    }

    remove (identifier: string) {
        delete this.symbolTable[identifier];
    }

    clear () {
        for (let symbol in this.symbolTable)
            this.remove(symbol);

        this.parent = undefined;
        this.deleted = true;
    }

    get root () {
        let parent: Context = this;

        while (parent.parent)
            parent = parent.parent;

        return parent;
    }

    resetAsGlobal () {
        if (!this.initialisedAsGlobal) return;

        const printFunc = this.root.get('print');
        const inputFunc = this.root.get('input');

        if (!(printFunc instanceof ESPrimitive) || !(inputFunc instanceof ESPrimitive)) {
            console.error('Error with print and input functions.');
            return;
        }

        this.symbolTable = {};
        this.initialisedAsGlobal = false;

        initialise(this, printFunc.valueOf()?.func || console.log, inputFunc.valueOf()?.func || (() => {}), this.libs);
    }

    clone (): Context {
        const newContext = new Context();
        newContext.parent = this.parent;
        newContext.deleted = this.deleted;
        newContext.initialisedAsGlobal = this.initialisedAsGlobal;
        newContext.libs = [...this.libs];
        newContext.symbolTable = {
            ...newContext.symbolTable,
            ...this.symbolTable
        };
        return newContext;
    }

    deepClone(): Context {
        console.log('cloning');
        let clone = this.clone();
        clone.parent = clone.parent?.deepClone();
        return clone;
    }

    /**
     * This context takes priority
     * @param {Context} context
     */
    mergeWith (context: Context) {
        this.root.parent = context.deepClone();
    }

    log () {
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

export function generateESFunctionCallContext (params: Primitive[], self: ESFunction, parent: Context) {

    const newContext = new Context();
    newContext.parent = parent;

    let max = Math.max(params.length, self.arguments_.length);

    for (let i = 0; i < max; i++) {

        let value: Primitive = new ESUndefined();
        let type = types.any;

        if (self.arguments_[i] == undefined) continue;

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

        newContext.setOwn(arg.name, value, {
            forceThroughConst: true
        });
    }

    let setRes = newContext.setOwn('args', new ESArray(params));
    if (setRes instanceof ESError) return setRes;
    return newContext;
}