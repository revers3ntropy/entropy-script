import {ESError, TypeError} from "./errors.js";
import {Position} from "./position.js";
import { ESArray, ESNumber, Primitive } from "./primitiveTypes.js";

export const builtInFunctions: {[name: string]: (...args: Primitive[]) => any} = {
    'range': (num: Primitive) => {
        if (!(num instanceof ESNumber))
            return new TypeError(Position.unknown, 'Number', num.typeOf().valueOf(), num.valueOf());

        const n: any = num.valueOf();

        try {
            return new ESArray([...Array(n).keys()].map(n => new ESNumber(n)));
        } catch (e) {
            return new ESError(Position.unknown, 'RangeError', `Cannot make range of length '${num.str()}'`);
        }
    },

    'log': (msg: Primitive) => {
        console.log(msg.str().valueOf());
    },

    'parseNum': (str: Primitive) => {
        try {
            const val: number = parseFloat(str.str().valueOf());
            if (isNaN(val))
                return new ESNumber();
            return new ESNumber(val);
        } catch (e) {
            return new TypeError(Position.unknown, 'String', str.typeOf().valueOf(), str.valueOf(), 'This string is not parseable as a number');
        }
    }
}
