import {ESError, TypeError} from "../errors.js";
import {Position} from "../position.js";
import {
    ESArray, ESFunction, ESNamespace,
    ESNumber,
    ESObject,
    ESPrimitive,
    ESString, ESUndefined,
    FunctionInfo,
    Primitive,
} from '../runtime/primitiveTypes.js';
import {BuiltInFunction, indent, sleep, str} from '../util/util.js';

export const builtInFunctions: {[n: string]: [BuiltInFunction, FunctionInfo]} = {
    'range': [({context}, num) => {
        if (!(num instanceof ESNumber))
            return new TypeError(Position.unknown, 'Number', num.typeOf().valueOf(), num.valueOf());

        const n: any = num.valueOf();

        try {
            return new ESArray([...Array(n).keys()].map(n => new ESNumber(n)));
        } catch (e) {
            return new ESError(Position.unknown, 'RangeError', `Cannot make range of length '${str(num)}'`);
        }
    }, {
       args: [{
           name: 'N',
           type: 'Number',
       }],
        description: 'Generates an array of integers given N. Starts at 0 and goes to N-1. Can be used like for (i in range(10)) ..., similarly to python.',
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
            if (isNaN(val))
                return new ESNumber();
            return new ESNumber(val);
        } catch (e) {
            return new TypeError(Position.unknown, 'String', num.typeOf().valueOf(), num.valueOf(), 'This string is not parse-able as a number');
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

        if (!things.length)
            return new ESString(`
Visit https://entropygames.io/entropy-script for help with Entropy Script!
Try 'help(object)' for help about a particular object.
`);

        let out = '';

        for (const thing of things) {
            const info = thing.info;
            out += `${`Help on '${info.name || '(anonymous)'.yellow}'`.yellow}:
    
    ${'Value'.yellow}: ${indent(indent(str(thing)))}
    ${'Type'.yellow}: '${str(thing.typeOf())}'
    ${'Location'.yellow}: ${info.file || '(unknown)'.yellow}
    
        ${info.description?.green || `No description.`}
        
    ${info.helpLink ? (info.helpLink + '\n\n').cyan : ''}
`;
            if (info.args && thing instanceof ESFunction) {
                const total = info.args.length;
                const required = info.args.filter(a => a.required).length;
                if (total == required)
                    out += `    Arguments (${total}): \n`.yellow;
                else
                    out += `    Arguments (${required}-${total}): \n`.yellow;

                for (const [idx, arg] of info.args.entries()) {
                    if (typeof arg !== 'object') out += `        ${idx + 1}. INVALID ARG INFO`;
                    else out += `        ${idx + 1}. ${arg.name}${arg.required === false ? ' (optional) ' : ' '.yellow}{${arg.type}} ${arg.description || ''}\n`;
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
        if (things.length > 1)
            return new ESArray(things);
        if (things)
            return things[0];
    }, {
        args: [{
            name: 'value',
             type: 'any'
        }],
        description: 'logs info on value',
        returns: 'value passed in'
    }],

    'describe': [({context}, thing, description) => {
        thing.info.description = str(description);
        return thing;
    }, {
        args: [{
            name: 'value',
            type: 'any'
        }, {
            name: 'description',
            type: 'string'
        }],
        description: `Adds a description to whatever is passed in. Can be seen by calling help(value). Add more details with the 'detail' function`,
        returns: 'the value passed in',
        returnType: 'any'
    }],

    'detail': [({context}, thing, info) => {
        if (!(info instanceof ESObject))
            return new TypeError(Position.unknown, 'object', str(info.typeOf()), str(info));

       if (thing.info.isBuiltIn)
           return new ESError(Position.unknown, 'TypeError',`Can't edit info for built-in value ${thing.info.name} with 'detail'`);

        thing.info = ESPrimitive.strip(info);
        thing.info.isBuiltIn = false;

        return thing;
    }, {
        args: [{
            name: 'value',
            type: 'any'
        }, {
            name: 'info',
            type:
`   Info {
        name?: string,
        description?: string,
        file?: string,
        helpLink?: string,
        args?: {
            name?: string,
            type?: string,
            description?: string,
            required?: boolean
        }[],
        returns?: string,
        returnType?: string,
        contents?: Info[]
    }`
        }],
        returns: 'the value passed',

    }],

    'cast': [({context}, thing) => {

    }, {

    }],

    'using': [({context}, module) => {
        if (!(module instanceof ESNamespace))
            return new TypeError(Position.unknown, 'Namespace', str(module.typeOf()));

        const values = module.valueOf();
        for (const key in values) {
            context.setOwn(key, values[key].value, {
                isConstant: values[key].isConstant,
                isAccessible: values[key].isAccessible,
                forceThroughConst: true
            });
        }
    }, {

    }],

    'sleep': [({context}, time, cb) => {
        if (!(time instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(time.typeOf()), str(time));
        if (!(cb instanceof ESFunction))
            return new TypeError(Position.unknown, 'function', str(cb.typeOf()), str(cb));

        sleep(time.valueOf())
            .then(() => {
                const res = cb.__call__([]);
                if (res instanceof ESError)
                    console.log(res.str);
            });
    }, {

    }],
}
