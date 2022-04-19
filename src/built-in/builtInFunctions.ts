import { Error, ImportError, TypeError, ReferenceError, PermissionRequiredError, InvalidRuntimeError } from "../errors";
import { strip, wrap } from '../runtime/wrapStrip';
import {
    ESArray, ESErrorPrimitive, ESFunction, ESNamespace,
    ESNumber,
    ESObject,
    ESPrimitive,
    ESString, ESType, ESNull,
    IFunctionInfo,
} from '../runtime/primitiveTypes';
import { BuiltInFunction, Map, IFuncProps, indent, sleep, str } from '../util/util';
import { ESJSBinding } from "../runtime/primitives/jsbinding";
import chalk from "../util/colours";
import {IS_NODE_INSTANCE, types} from '../util/constants';
import {addModule, getModule, moduleExist} from './builtInModules';
import { config } from "../config";
import { ESInterface } from "../runtime/primitives/interface";

export const builtInFunctions: Map<[BuiltInFunction, IFunctionInfo]> = {
    range: [(props, minP, maxP, stepP) => {
        if (!(minP instanceof ESNumber)) {
            return new ESArray();
        }

        const min = minP.__value__;

        if (maxP instanceof ESNull) {
            try {
                return new ESArray([...Array(min).keys()].map(n => new ESNumber(n)));
            } catch (e) {
                return new Error('RangeError', `Cannot make range of length '${str(min)}'`);
            }
        }

        let step = 1;

        if (!(maxP instanceof ESNumber)) {
            return new TypeError('number', maxP.__type_name__(), str(maxP));
        }

        const max = maxP.__value__;

        if (!(stepP instanceof ESNull)) {
            if (!(stepP instanceof ESNumber)) {
                return new TypeError('number', stepP.__type_name__(), str(stepP));
            }
            step = stepP.__value__;
        }

        const arr = [];

        let i = min;
        while (i < max) {
            arr.push(new ESNumber(i));
            i += step;
        }

        return new ESArray(arr);

    }, {
       args: [
           { name: 'min', type: 'Num' },
           { name: 'max', type: 'Num' },
           { name: 'step', type: 'Num' }
       ],
        description: 'Generates an array of integers given N. Starts at 0 and goes to N-1. Can be used like for i in range(10) ..., similarly to python.',
        returns: 'array of numbers from 0 to N-1',
        returnType: 'Arr[Num] | RangeError'
    }],

    log: [(props, ...msgs) => {
        console.log(...msgs.map(m => str(m)));
    }, {
        args: [{
            name: '...values',
            type: 'any[]'
        }],
        description: 'Uses console.log to log all values',
        returnType: 'nil',
        allow_args: true
    }],

    parse_num: [(props, num) => {
        try {
            const val: number = parseFloat(str(num));
            if (isNaN(val)) {
                return new Error('TypeError', `Cannot convert '${str(num)}' to a number.`)
            }
            return new ESNumber(val);
        } catch (e) {
            return new Error('TypeError', `Cannot convert '${str(num)}' to a number.`)
        }
    }, {
        args: [{
            name: 'num',
            type: 'Any'
        }],
        description: `Converts a string of digits into a number. Works with decimals and integers. Calls .str() on value before using native JS 'parseFloat' function. Returns TypeError if the string can't be converted into a number.`,
        returnType: 'number | TypeError'
    }],

    help: [(props, ...things) => {
        // Optional kwarg 'NoParam' which gets passed to help,
        // which will force it to return the default help string rather than help on the nil only parameter
        if ('NoParam' in (props.kwargs ?? {})) {
            return new ESString(
                'Visit https://entropygames.io/entropy-script for help\n' +
                'Try \'help(object)\' for help about a particular object.'
            );
        }

        let out = '';

        for (const thing of things) {
            if (!(thing instanceof ESPrimitive)) {
                console.log('Invalid arg not primitive: ' + str(thing));
                return;
            }
            const info = thing.__info__;

            out += `${chalk.yellow(`Help on '${info.name || '(anonymous)'}'`)}:`;
            out += `\n`;
            out += `    ${chalk.yellow('Value')}: ${indent(indent(str(thing)))}`;
            out += `    ${chalk.yellow('Type')}: '${str(thing.__type_name__())}'`;
            out += `    ${chalk.yellow('Location')}: ${info.file || chalk.yellow('(unknown)')}`
            out += `        ${chalk.green(info.description) || `No description.`}`
            out += `    ${info.helpLink ? chalk.cyan(info.helpLink + '\n\n') : ''}`;

            if (info.args && thing instanceof ESFunction) {
                const total = info.args.length;
                const required = info.args.filter(a => a.required).length;
                if (total == required) {
                    out += chalk.yellow(`    Arguments (${total}): \n`);
                } else {
                    out += chalk.yellow(`    Arguments (${required}-${total}): \n`);
                }

                for (const [idx, arg] of info.args.entries()) {
                    if (typeof arg !== 'object') out += `        ${idx + 1}. INVALID ARG INFO`;
                    else out += `        ${idx + 1}. ${arg.name}${arg.required === false ? chalk.yellow(' (optional) ') : ' '}{${arg.type}} ${arg.description || ''}\n`;
                }

                out += `\n\n`;
                if (info.returns) {
                    out += `    Returns: ${info.returns}\n\n`;
                }
                if (info.returnType) {
                    out += `    Return Type: ${info.returnType}\n\n`;
                }
            }

            if (info.contents && (thing instanceof ESObject || thing instanceof ESNamespace)) {
                out += '    Properties: \n      ';
                for (const contents of info.contents) {
                    out += contents.name + '\n      ';
                }
            }
        }

        return new ESString(out);

    }, {
        description: 'Logs documentation about a value',
        returns: 'value passed in',
        allow_args: true,
        allow_kwargs: true,
        returnType: 'Str'
    }],

    delete: [({context}, name) => {
        const id = str(name);
        const res = context.remove(id);
        if (res instanceof Error) return res;
    }, {
        name: 'delete',
        args: [{name: 'identifier', type: 'Str'}],
        description: 'Deletes a variable from the current context'
    }],

    __path__: [({context}) => {
        return new ESString(context.path);
    }, {
        name: '__path__',
        args: [],
        description: 'Returns the current path',
        returnType: 'Str'
    }],

    __symbols__: [(props, recursive) => {
        let {context} = props;

        if (recursive.bool(props).__value__) {
            let keys = context.keys;
            while (context.parent) {
                keys = context.parent.keys;
                context = context.parent;
            }
            return wrap(keys);
        }
        return wrap(context.keys);
    }, {
        name: '__symbols__',
        args: [{
            name: 'recursive',
            type: 'Bool',
            description: 'if true, returns the names of all symbols available in the current scope, if false, just the symbols declared in the current scope.'
        }],
        returns: 'The names of all symbols in the current context',
        returnType: 'Arr<|Str|>'
    }],

    using: [(props: IFuncProps, module, global_) => {
        if (!(module instanceof ESNamespace) && !(module instanceof ESJSBinding) && !(module instanceof ESObject)) {
            return new TypeError('Namespace', str(module.__type_name__()));
        }

        let { context } = props;

        // trust me, this works... hopefully
        const global = !(global_ && !global_.bool(props).__value__);

        const value = strip(module, props);

        if (global) {
            context = context.root;
        } else if (context.parent) {
            // as new context is generated for function call, so escape to one you want the values in
            context = context.parent;
        }

        for (const key of Object.keys(value)) {
            const res = context.setOwn(key, wrap(value[key]));
            if (res) return res;
        }
    }, {
        name: 'using',
        args: [
            {name: 'module', type: 'Obj'},
            {name: 'global', type: 'Bool'}
        ],
        description: 'Adds contents of a namespace to the current or global context',
        returnType: 'nil'
    }],

    sleep: [({context}, time, cb) => {
        if (!(time instanceof ESNumber)) {
            return new TypeError('number', str(time.__type_name__()), str(time));
        }

        sleep(time.__value__)
            .then(() => {
                const res = cb.__call__({context});
                if (res instanceof Error) {
                    console.log(res.str);
                }
            });
    }, {
        name: 'sleep',
        args: [
            {name: 'time', type: 'Num'},
            {name: 'callback', type: 'Func'}
        ],
        description: 'Waits n milliseconds and then executes the callback'
    }],

    throw: [(props, name, details) => {
        if (name instanceof ESErrorPrimitive) {
            return name.__value__;
        }
        return new Error(str(name), str(details));
    }, {
        name: 'throw',
        args: [
            {name: 'name', type: 'Str'},
            {name: 'details', type: 'Str' }
        ]
    }],

    typeof: [({context}, symbolPrim) => {
        if (!(symbolPrim instanceof ESString)) {
            return new TypeError('Str', symbolPrim.__type_name__(), str(symbolPrim));
        }

        const symbol = str(symbolPrim);

        if (!context.has(symbol)) {
            return new ReferenceError(symbol);
        }

        const res = context.getSymbol(symbol);

        if (!res) {
            return new ReferenceError(symbol);
        }
        if (res instanceof Error) {
            return res;
        }

        return res.type;
    }, {
        name: 'typeof',
        args: [
            {name: 'identifier', type: 'Str'}
        ]
    }],

    interface: [(props, val) => {
        if (!(val instanceof ESObject)) {
            return new TypeError('Obj', val.__type_name__(), str(val));
        }
        return new ESInterface(val.__value__);
    }, {
        name: 'throw',
        args: [{name: 'value', type: 'Obj'}]
    }],
}

export function addDependencyInjectedBIFs (
    printFunc: (...args: string[]) => void,
    inputFunc: (msg: string, cb: (...arg: any[]) => any) => void
) {
    builtInFunctions['import'] = [(props: IFuncProps, rawUrl) => {
        if (IS_NODE_INSTANCE) {
            return new InvalidRuntimeError();
        }
        if (!config.permissions.imports) {
            return new PermissionRequiredError('Imports not allowed');
        }

        if (!(rawUrl instanceof ESString)) {
            return new TypeError('Str', rawUrl.__type_name__(), str(rawUrl));
        }

        const scriptPath: string = str(rawUrl);

        if (config.permissions.useSTD && moduleExist(scriptPath)) {
            return getModule(scriptPath);
        }

        return new ImportError(scriptPath, 'Module not found. Try adding it to the pre-loaded modules.');
    }, {
        description: 'Loads a module. Cannot be used asynchronously, so add any modules to pre-load in the esconfig.json file.',
        args: [{name: 'path', type: 'Str'}]
    }];

    builtInFunctions['print'] = [(props, ...args) => {
        let out = ``;
        for (const arg of args) {
            out += str(arg);
        }
        printFunc(out);
    }, {
        allow_args: true
    }];

    builtInFunctions['input'] = [({context}, msg, cbRaw) => {
        inputFunc(msg.__value__, (msg) => {
            const cb = cbRaw?.__value__;
            if (cb instanceof ESFunction) {
                const res = cb.__call__({context},
                    new ESString(msg)
                );
                if (res instanceof Error) {
                    console.log(res.str);
                }
            } else if (typeof cb === 'function') {
                cb(msg);
            }

            return new ESString('\'input()\' does not return anything. Pass in a function as the second argument, which will take the user input as an argument.');
        })
    }, {
        args: [{name: 'msg', type: 'Str'}, {name: 'callback', type: 'Func'}]
    }];
    builtInFunctions['module'] = [(props, name, module) => {
        if (!(name instanceof ESString)) {
            return new TypeError('Str', name.__type_name__(), str(name));
        }
        if (
            module instanceof ESFunction
            || module instanceof ESType
            || module instanceof ESObject
            || module instanceof ESJSBinding
            || module instanceof ESNamespace
        ) {
            addModule(str(name), module);

        } else {
            return new TypeError('Obj | Func', name.__type_name__(), str(name));
        }
    }, {
        args: [{name: 'msg', type: 'Str'}, {name: 'module', type: 'namespace'}]
    }];
}