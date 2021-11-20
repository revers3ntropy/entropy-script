import {ESError, TypeError} from "../errors.js";
import {Position} from "../position.js";
import {ESArray, ESNumber, ESString, FunctionInfo, Info, Primitive} from "../runtime/primitiveTypes.js";
import {memorySizeOf, str} from "../util/util.js";

export const builtInFunctions: {[name: string]: [(...args: Primitive[]) => Primitive | ESError | Promise<void> | void, FunctionInfo]} = {
    'range': [(num) => {
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

    'log': [(...msgs) => {
        console.log(...msgs.map(m => str(m)));
    }, {
        args: [{
            name: '...values',
            type: 'any[]'
        }],
        description: 'Uses console.log to log all values',
        returnType: 'void'
    }],

    'parseNum': [(num) => {
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

    'describe': [(thing, description) => {
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

    'help': [(...things) => {

        if (!things.length)
            return new ESString(`
Visit https://entropygames.io/entropy-script for help with Entropy Script!
Try 'help(object)' for help about a particular object.
`);

        let out = '';

        for (const thing of things) {
            const info = thing.info;
            out += `Help on '${info.name || '(unnamed value)'}':
        
    Type: '${str(thing.typeOf())}'
    Location: ${info.file || '(unknown)'}
    
        ${info.description || `No description provided. Add one with 'describe'`}
        
    ${info.helpLink ? info.helpLink + '\n\n' : ''}
`;
            if (info.args) {
                const total = info.args.length;
                const required = info.args.filter(a => a.required).length;
                if (total == required)
                    out += `    Arguments (${total}): \n`;
                else
                    out += `    Arguments (${required}-${total}): \n`;

                for (const [idx, arg] of info.args.entries())
                    out += `        ${idx+1}. ${arg.name}${arg.required ? ' ' : ' (optional) '}{${arg.type}} ${arg.description || ''}`;

                out += `\n\n`;
                if (info.returns)
                    out += `    Returns: ${info.returns}\n\n`;
                if (info.returnType)
                    out += `    Return Type: ${info.returnType}\n\n`;
            }

            if (info.contents) {
                out += '    Properties: \n      ';
                for (let contents of info.contents)
                    out += contents.name + '\n      ';
            }

            out += '\n\n';
        }

        return new ESString(out);
    }, {
        args: [{
            name: 'value',
             type: 'any'
        }],
        description: 'Gives info on value',
        returnType: 'string'
    }],

    'cast': [() => {

    }, {

    }],
}
