import { Error, ImportError, TypeError, ReferenceError } from "../errors";
import Position from "../position";
import { strip, wrap } from '../runtime/wrapStrip';
import {
    ESArray, ESErrorPrimitive, ESFunction, ESNamespace,
    ESNumber,
    ESObject,
    ESPrimitive,
    ESString, ESType, ESUndefined,
    FunctionInfo, Primitive,
} from '../runtime/primitiveTypes';
import { BuiltInFunction, dict, funcProps, indent, sleep, str } from '../util/util';
import { ESJSBinding } from "../runtime/primitives/esjsbinding";
import chalk from "../util/colours";
import {IS_NODE_INSTANCE, global, types} from '../util/constants';
import {addModule, getModule, moduleExist} from './builtInModules';
import { ESInterface } from "../runtime/primitives/esobject";

export const builtInFunctions: dict<[BuiltInFunction, FunctionInfo]> = {
    range: [({context}, minP, maxP, stepP) => {
        if (!(minP instanceof ESNumber)) {
            return new ESArray();
        }

        const min = minP.__value__;

        if (maxP instanceof ESUndefined) {
            try {
                return new ESArray([...Array(min).keys()].map(n => new ESNumber(n)));
            } catch (e) {
                return new Error(Position.void, 'RangeError', `Cannot make range of length '${str(min)}'`);
            }
        }

        let step = 1;

        if (!(maxP instanceof ESNumber)) {
            return new TypeError(Position.void, 'number', maxP.__type_name__(), str(maxP));
        }

        let max = maxP.__value__;

        if (!(stepP instanceof ESUndefined)) {
            if (!(stepP instanceof ESNumber)) {
                return new TypeError(Position.void, 'number', stepP.__type_name__(), str(stepP));
            }
            step = stepP.__value__;
        }

        let arr = [];

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

    log: [({context}, ...msgs) => {
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

    parse_num: [({context}, num) => {
        try {
            const val: number = parseFloat(str(num));
            if (isNaN(val)) {
                return new Error(Position.void, 'TypeError', `Cannot convert '${str(num)}' to a number.`)
            }
            return new ESNumber(val);
        } catch (e) {
            return new Error(Position.void, 'TypeError', `Cannot convert '${str(num)}' to a number.`)
        }
    }, {
        args: [{
            name: 'num',
            type: 'Any'
        }],
        description: `Converts a string of digits into a number. Works with decimals and integers. Calls .str() on value before using native JS 'parseFloat' function. Returns TypeError if the string can't be converted into a number.`,
        returnType: 'number | TypeError'
    }],

    help: [({context}, ...things) => {
        // I am truly disgusted by this function.
        // But I am not going to make it look better.

        if (!things.length) {
            return new ESString(
                'Visit https://entropygames.io/entropy-script for help with Entropy Script!\n' +
                'Try \'help(<anything>)\' for help about a particular object.'
            );
        }

        let out = '';

        for (const thing of things) {
            if (!(thing instanceof ESPrimitive)) {
                console.log('Invalid arg not primitive: ' + str(thing));
                return;
            }
            const info = thing.__info__;
            out += `${chalk.yellow(`Help on '${info.name || '(anonymous)'}'`)}:
    
    ${chalk.yellow('Value')}: ${indent(indent(str(thing)))}
    ${chalk.yellow('Type')}: '${str(thing.__type_name__())}'
    ${chalk.yellow('Location')}: ${info.file || chalk.yellow('(unknown)')}
    
        ${chalk.green(info.description) || `No description.`}
        
    ${info.helpLink ? chalk.cyan(info.helpLink + '\n\n') : ''}
`;
            if (info.args && thing instanceof ESFunction) {
                const total = info.args.length;
                const required = info.args.filter(a => a.required).length;
                if (total == required)
                    out += chalk.yellow(`    Arguments (${total}): \n`);
                else
                    out += chalk.yellow(`    Arguments (${required}-${total}): \n`);

                for (const [idx, arg] of info.args.entries()) {
                    if (typeof arg !== 'object') out += `        ${idx + 1}. INVALID ARG INFO`;
                    else out += `        ${idx + 1}. ${arg.name}${arg.required === false ? chalk.yellow(' (optional) ') : ' '}{${arg.type}} ${arg.description || ''}\n`;
                }

                out += `\n\n`;
                if (info.returns)
                    out += `    Returns: ${info.returns}\n\n`;
                if (info.returnType)
                    out += `    Return Type: ${info.returnType}\n\n`;
            }

            if (info.contents && (thing instanceof ESObject || thing instanceof ESNamespace)) {
                out += '    Properties: \n      ';
                for (let contents of info.contents)
                    out += contents.name + '\n      ';
            }
        }

        console.log(out);
        if (things.length > 1) {
            return new ESArray(things);
        }
        if (things) {
            return things[0];
        }
    }, {
        args: [{
            name: 'value',
             type: 'Any'
        }],
        description: 'logs info on value',
        returns: 'value passed in',
        allow_args: true
    }],

    delete: [({context}, name) => {
        const id = str(name);
        let res = context.remove(id);
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
        description: 'Returns the current path'
    }],

    __symbols__: [({context}, recursive) => {
        if (recursive.bool().__value__) {
            let keys = context.keys;
            while (context.parent) {
                keys = context.parent.keys;
                context = context.parent;
            }
            return wrap(keys);
        }
        return wrap(context.keys);
    }, {
        name: '__symbols',
        args: [{
            name: 'recursive',
            type: 'Bool',
            description: 'if true, returns the names of all symbols available in the current scope, if false, just the symbols declared in the current scope.'
        }],
        description: 'Returns an array of the names of all symbols in the current context'
    }],

    using: [(props: funcProps, module, global_) => {
        if (!(module instanceof ESNamespace) && !(module instanceof ESJSBinding) && !(module instanceof ESObject)) {
            return new TypeError(Position.void, 'Namespace', str(module.__type_name__()));
        }

        let {context} = props;

        // trust me, this works... hopefully
        let global = !(global_ && !global_.bool().__value__);

        let value = strip(module, props);

        if (global) {
            context = context.root;
        } else if (context.parent) {
            // as new context is generated for function call, so escape to one you want the values in
            context = context.parent;
        }

        for (const key of Object.keys(value)) {
            let res = context.setOwn(key, wrap(value[key]));
            if (res) return res;
        }
    }, {
        name: 'using',
        args: [
            {name: 'module', type: 'Obj'},
            {name: 'global', type: 'Bool'}
        ],
        description: 'Adds contents of a namespace to the current or global context'
    }],

    sleep: [({context}, time, cb) => {
        if (!(time instanceof ESNumber)) {
            return new TypeError(Position.void, 'number', str(time.__type_name__()), str(time));
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

    throw: [({context}, name, details) => {
        if (name instanceof ESErrorPrimitive) {
            return name.__value__;
        }
        return new Error(Position.void, str(name), str(details));
    }, {
        name: 'throw',
        args: [
            {name: 'name', type: 'Str'},
            {name: 'details', type: 'Str' }
        ]
    }],

    typeof: [({context}, symbolPrim) => {
        if (!(symbolPrim instanceof ESString)) {
            return new TypeError(Position.void, 'Str', symbolPrim.__type_name__(), str(symbolPrim));
        }

        let symbol = str(symbolPrim);

        if (!context.has(symbol)) {
            return new ReferenceError(Position.void, symbol);
        }

        let res = context.getSymbol(symbol);

        if (!res) {
            return new ReferenceError(Position.void, symbol);
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

    interface: [({context}, val) => {
        if (!(val instanceof ESObject)) {
            return new TypeError(Position.void, 'Obj', val.__type_name__(), str(val));
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
    builtInFunctions['import'] = [(props: funcProps, rawUrl) => {
        if (IS_NODE_INSTANCE) {
            return new Error(Position.void, 'ImportError', 'Is running in node instance but trying to run browser import function');
        }
        if (!(rawUrl instanceof ESString)) {
            return new TypeError(Position.void, 'String', rawUrl.__type_name__(), str(rawUrl));
        }
        const url = str(rawUrl);

        if (moduleExist(url)) {
            return getModule(url);
        }

        return new ImportError(Position.void, url, 'Module not found. Try adding it to the pre-loaded modules.');
    }, {
        description: 'Loads a module. Cannot be used asynchronously, so add any modules to pre-load in the esconfig.json file.',
        args: [{name: 'path', type: 'String'}]
    }];

    builtInFunctions['print'] = [({context}, ...args) => {
        let out = ``;
        for (let arg of args) {
            out += str(arg);
        }
        printFunc(out);
    }, {
        allow_args: true
    }];

    builtInFunctions['input'] = [({context}, msg, cbRaw) => {
        inputFunc(msg.__value__, (msg) => {
            let cb = cbRaw?.__value__;
            if (cb instanceof ESFunction) {
                let res = cb.__call__({context},
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
            return new TypeError(Position.void, 'Str', name.__type_name__(), str(name));
        }
        if (module.__type__ === types.object) {
            addModule(str(name), new ESJSBinding(module.__value__, str(name), false));

        } else if (module instanceof ESFunction || module instanceof ESType) {
            addModule(str(name), module);

        } else {
            return new TypeError(Position.void, 'Obj | Func', name.__type_name__(), str(name));
        }
    }, {
        args: [{name: 'msg', type: 'Str'}, {name: 'module', type: 'namespace'}]
    }];
}