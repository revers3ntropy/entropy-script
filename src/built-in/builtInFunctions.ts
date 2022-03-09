import {ESError, TypeError} from "../errors";
import {Position} from "../position";
import { wrap } from '../runtime/primitives/wrapStrip';
import {
    ESArray, ESFunction, ESNamespace,
    ESNumber,
    ESObject,
    ESPrimitive,
    ESString, ESUndefined,
    FunctionInfo
} from '../runtime/primitiveTypes';
import {BuiltInFunction, indent, sleep, str} from '../util/util';
import { ESJSBinding } from "../runtime/primitives/esjsbinding";
import chalk from "../util/colours";

export const builtInFunctions: {[key: string]: [BuiltInFunction, FunctionInfo]} = {
    'range': [({context}, minP, maxP, stepP) => {
        if (!(minP instanceof ESNumber)) {
            return new ESArray();
        }

        const min = minP.valueOf();

        if (maxP instanceof ESUndefined) {
            try {
                return new ESArray([...Array(min).keys()].map(n => new ESNumber(n)));
            } catch (e) {
                return new ESError(Position.void, 'RangeError', `Cannot make range of length '${str(min)}'`);
            }
        }

        let step = 1;

        if (!(maxP instanceof ESNumber)) {
            return new TypeError(Position.void, 'number', maxP.typeName(), str(maxP));
        }

        let max = maxP.valueOf();

        if (!(stepP instanceof ESUndefined)) {
            if (!(stepP instanceof ESNumber)) {
                return new TypeError(Position.void, 'number', stepP.typeName(), str(stepP));
            }
            step = stepP.valueOf();
        }

        let arr = [];

        let i = min;
        while (i < max) {
            arr.push(new ESNumber(i));
            i += step;
        }

        return new ESArray(arr);

    }, {
       args: [{
           name: 'N',
           type: 'Number',
       }],
        description: 'Generates an array of integers given N. Starts at 0 and goes to N-1. Can be used like for i in range(10) ..., similarly to python.',
        returns: 'array of numbers from 0 to N-1',
        returnType: 'number[] | RangeError'
    }],

    'log': [({context}, ...msgs) => {
        console.log(...msgs.map(m => str(m)));
    }, {
        args: [{
            name: '...values',
            type: 'any[]'
        }],
        description: 'Uses console.log to log all values',
        returnType: 'void'
    }],

    'parseNum': [({context}, num) => {
        try {
            const val: number = parseFloat(str(num));
            if (isNaN(val)) {
                return new ESError(Position.void, 'TypeError', `Cannot convert '${str(num)}' to a number.`)
            }
            return new ESNumber(val);
        } catch (e) {
            return new ESError(Position.void, 'TypeError', `Cannot convert '${str(num)}' to a number.`)
        }
    }, {
        args: [{
            name: 'num',
            type: 'any'
        }],
        description: `Converts a string of digits into a number. Works with decimals and integers. Calls .str() on value before using native JS 'parseFloat' function. Returns TypeError if the string can't be converted into a number.`,
        returnType: 'number | TypeError'
    }],

    'help': [({context}, ...things) => {
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
            const info = thing.info;
            out += `${chalk.yellow(`Help on '${info.name || '(anonymous)'}'`)}:
    
    ${chalk.yellow('Value')}: ${indent(indent(str(thing)))}
    ${chalk.yellow('Type')}: '${str(thing.typeName())}'
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
             type: 'any'
        }],
        description: 'logs info on value',
        returns: 'value passed in'
    }],

    'delete': [({context}, name) => {
        const id = str(name);
        if (!context.has(id)) {
            return new ESError(Position.void, 'DeleteError', `Identifier '${id}' not found in the current context`);
        }
        context.set(id, new ESUndefined());
    }, {
        name: 'delete',
        args: [{name: 'identifier', type: 'string'}],
        description: 'Deletes a variable from the current context'
    }],

    '__path': [({context}) => {
        return new ESString(context.path);
    }, {
        name: '__path',
        args: [],
        description: 'Returns the current path'
    }],

    '__symbols': [({context}) => {
        return wrap(context.keys);
    }, {
        name: '__allSymbols',
        args: [],
        description: 'Returns an array of the names of all symbols in the current context'
    }],

    'using': [({context}, module, global_) => {
        if (!(module instanceof ESNamespace) && !(module instanceof ESJSBinding)) {
            return new TypeError(Position.void, 'Namespace', str(module.typeName()));
        }

        let global = true;

        if (global_) {
            if (!global_.bool().valueOf()) {
                global = false;
            }
        }

        const values = module.valueOf();

        if (global) {
            context = context.root;
        } else if (context.parent) {
            context = context.parent;
        }

        for (const key of Object.keys(values)) {
            context.setOwn(key, values[key].value, {
                isConstant: values[key].isConstant,
                isAccessible: values[key].isAccessible,
                forceThroughConst: true
            });
        }
    }, {
        name: 'using',
        args: [
            {name: 'module', type: 'namespace'},
            {name: 'global', type: 'bool'}
        ],
        description: 'Adds contents of a namespace to the global context'
    }],

    'sleep': [({context}, time, cb) => {
        if (!(time instanceof ESNumber)) {
            return new TypeError(Position.void, 'number', str(time.typeName()), str(time));
        }

        sleep(time.valueOf())
            .then(() => {
                const res = cb.__call__({context});
                if (res instanceof ESError) {
                    console.log(res.str);
                }
            });
    }, {
        name: 'sleep',
        args: [{name: 'n', type: 'number'}, {name: 'callback', type: 'function'}],
        description: 'Waits n milliseconds and then executes the callback'
    }],

    'throw': [({context}, name, details) => {
        return new ESError(Position.void, str(name), str(details));
    }, {
        name: 'throw',
        args: [{name: 'name', type: 'string'}, {name: 'details', type: 'string'}]
    }],
}
