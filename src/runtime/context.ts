import { Error, ReferenceError, TypeError } from "../errors";
import {wrap} from './wrapStrip';
import { ESArray, ESFunction, ESObject, ESPrimitive, ESUndefined, Primitive } from "./primitiveTypes";
import {Map, str} from "../util/util";
import {ESSymbol, ISymbolOptions} from './symbol';
import chalk from "../util/colours";
import { types } from "../util/constants";

export class Context {
    private symbolTable: Map<ESSymbol> = {};
    private parent_: Context | undefined;

    public initialisedAsGlobal = false;
    public deleted = false;

    public path_ = '';

    get path() {
        if (this.path_ || !this.parent) {
            return this.path_;
        }
        return this.parent.path;
    }

    set path (val: string) {
        this.path_ = val;
    }

    get parent () {
        return this.parent_;
    }
    set parent (val: Context | undefined) {
        if (val == this) {
            console.error(chalk.red(`Setting context parent to self`));
            return;
        }
        this.parent_ = val;
    }

    has (identifier?: string): boolean {
        if (!identifier) return false;
        return this.get(identifier) !== undefined;
    }

    hasOwn (identifier: string): boolean {
        return this.symbolTable[identifier] instanceof ESSymbol;
    }

    get (identifier: string): Primitive | Error | undefined {
        const symbol = this.getSymbol(identifier);
        if (symbol instanceof Error || symbol == undefined) {
            return symbol;
        }
        return symbol.value;
    }

    getSymbolTableAsDict (): Map<ESSymbol> {
        const symbols: Map<ESSymbol> = {};

        for (const key in this.symbolTable)
            symbols[key] = this.symbolTable[key];

        return symbols;
    }

    getSymbol (identifier: string): undefined | ESSymbol | Error {
        let symbol: ESSymbol | undefined = this.symbolTable[identifier];

        if (symbol && !symbol.isAccessible) {
            return new TypeError(
                'assessable',
                'inaccessible',
                symbol.identifier
            );
        }

        if (!symbol && this.parent) {
            const res = this.parent.getSymbol(identifier);
            if (res instanceof Error) {
                return res;
            }
            symbol = res;
        }

        return symbol;
    }

    set (identifier: string, value: Primitive, options: ISymbolOptions = {}) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let context: Context = this;

        if (options.global) {
            context = this.root;
        } else {
            // searches upwards to find the identifier,
            // and if none can be found, then it assigns it to the current context
            while (!context.hasOwn(identifier) && context.parent !== undefined) {
                context = context.parent;
            }

            if (!context.hasOwn(identifier)) {
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                context = this;
            }
        }
        return context.setOwn(identifier, value, options);
    }

    setOwn (identifier: string, value: Primitive, options: ISymbolOptions = {}): void | Error {

        if (!(value instanceof ESPrimitive)) {
            value = wrap(value);
        }

        if (options.global) {
            options.global = false;
            this.root.setOwn(identifier, value, options);
            return;
        }

        if (!options.forceThroughConst) {
            const symbol = this.symbolTable[identifier];
            if (symbol?.isConstant)
                return new TypeError(
                    'dynamic',
                    'constant',
                    identifier
                );
        }

        this.symbolTable[identifier] = new ESSymbol(value, identifier, options);
    }

    remove (identifier: string): Error | true {
        if (this.hasOwn(identifier)) {
            delete this.symbolTable[identifier];
            return true;
        } else if (this.parent) {
            return this.parent.remove(identifier);
        } else {
            return new ReferenceError(identifier);
        }
    }

    clear () {
        for (const symbol in this.symbolTable) {
            this.remove(symbol);
        }

        this.parent = undefined;
        this.deleted = true;
    }

    get root () {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let parent: Context = this;

        while (parent.parent) {
            parent = parent.parent;
        }

        return parent;
    }

    get keys () {
        return Object.keys(this.symbolTable);
    }

    clone (): Context {
        const newContext = new Context();
        newContext.parent = this.parent;
        newContext.deleted = this.deleted;
        newContext.initialisedAsGlobal = this.initialisedAsGlobal;
        newContext.symbolTable = {
            ...newContext.symbolTable,
            ...this.symbolTable
        };
        return newContext;
    }

    log () {
        console.log('---- CONTEXT ----');
        for (const key in this.symbolTable) {
            const symbol = this.symbolTable[key];
            let out = key;
            if (symbol.isConstant) {
                out += ' (CONST)';
            }
            if (!symbol.isAccessible) {
                out += ' (INACCESSIBLE)';
            }
            out += ': ';
            out += str(this.symbolTable[key].value);
            console.log(out);
        }

        console.log('-----------------');
    }
}

export function generateESFunctionCallContext (
    self: ESFunction,
    args: Primitive[],
    kwargs: Map<Primitive>,
    parent: Context,
    dontTypeCheck: boolean
) {

    const newContext = new Context();
    newContext.parent = parent;

    const parameters = self.__args__.filter(a => !a.isKwarg);

    if (!self.__allow_args__ && args.length > parameters.length) {
        return new Error('TypeError',
            `Too many arguments. Expected ${parameters.length} but got ${args.length}`);
    }

    for (let i = 0; i < args.length || i < parameters.length; i++) {

        let value: Primitive = new ESUndefined();
        let type: Primitive = types.any;

        if (!parameters[i]) {
            continue;
        }

        // type checking
        const param = parameters[i];

        if (args[i] instanceof ESPrimitive) {
            type = args[i].__type__;
            value = args[i];
        }

        if (param.defaultValue && args.length <= i) {
            newContext.setOwn(param.name, param.defaultValue, {
                forceThroughConst: true
            });
            continue;
        }

        if (!dontTypeCheck) {
            const typeIncludes = param.type.__includes__({context: parent}, args[i]);
            if (typeIncludes instanceof Error) return typeIncludes;
            if (!typeIncludes.__value__) {
                return new TypeError(str(param.type), str(type), str(value));
            }
        }

        newContext.setOwn(param.name, value, {
            forceThroughConst: true
        });
    }

    let setRes = newContext.setOwn('args', new ESArray(args), {
        forceThroughConst: true
    });
    if (setRes instanceof Error) {
        return setRes;
    }

    const lookedAtKwargs = [];

    for (const kwarg of self.__args__.filter(a => a.isKwarg)) {

        let arg = kwargs[kwarg.name];

        if (!arg) {
            if (kwarg.defaultValue) {
                arg = kwarg.defaultValue;
            } else {
                return new TypeError('Any', 'Undefined');
            }
        }

        if (!dontTypeCheck) {
            const type = arg.__type__;
            const typeIncludes = kwarg.type.__includes__({context: parent}, arg);
            if (typeIncludes instanceof Error) return typeIncludes;
            if (!typeIncludes.__value__) {
                return new TypeError(str(kwarg.type), str(type), str(arg));
            }
        }

        newContext.setOwn(kwarg.name, arg, {
            forceThroughConst: true
        });

        lookedAtKwargs.push(kwarg.name);
    }

    if (!self.__allow_kwargs__) {
        for (const k of Object.keys(kwargs)) {
            if (lookedAtKwargs.indexOf(k) === -1) {
                return new Error('TypeError',
                    `Kwarg '${Object.keys(kwargs)[0]}' is not a parameter of '${self.name}'`);
            }
        }
    }

    setRes = newContext.setOwn('kwargs', new ESObject(kwargs), {
        forceThroughConst: true
    });

    if (setRes instanceof Error) {
        return setRes;
    }

    return newContext;
}