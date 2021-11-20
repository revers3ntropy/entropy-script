import { ESError, TypeError } from "./errors.js";
import { Position } from "./position.js";
import { ESArray, ESNumber } from "./primitiveTypes.js";
import { str } from "./util.js";
export const builtInFunctions = {
    'range': (num) => {
        if (!(num instanceof ESNumber))
            return new TypeError(Position.unknown, 'Number', num.typeOf().valueOf(), num.valueOf());
        const n = num.valueOf();
        try {
            return new ESArray([...Array(n).keys()].map(n => new ESNumber(n)));
        }
        catch (e) {
            return new ESError(Position.unknown, 'RangeError', `Cannot make range of length '${num.str()}'`);
        }
    },
    'log': (...msgs) => {
        console.log(...msgs.map(m => str(m)));
    },
    'parseNum': (str) => {
        try {
            const val = parseFloat(str.str().valueOf());
            if (isNaN(val))
                return new ESNumber();
            return new ESNumber(val);
        }
        catch (e) {
            return new TypeError(Position.unknown, 'String', str.typeOf().valueOf(), str.valueOf(), 'This string is not parseable as a number');
        }
    }
};
