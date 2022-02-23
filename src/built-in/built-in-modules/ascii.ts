import {TypeError} from '../../errors.js';
import {Position} from '../../position.js';
import { ESNumber, ESString, Primitive} from '../../runtime/primitiveTypes.js';
import {str} from '../../util/util.js';
import type {JSModule} from '../module.js';

const module: JSModule = {
    asciiToChar: (props, number: Primitive) => {
        if (!(number instanceof ESNumber)) {
            return new TypeError(Position.unknown, 'number', str(number.typeName()), str(number));
        }
        return new ESString(String.fromCharCode(number.valueOf()));
    },

    charToAscii: (props, char: Primitive) => {
        if (!(char instanceof ESString)) {
            return new TypeError(Position.unknown, 'string', str(char.typeName()), str(char));
        }
        return new ESNumber(str(char).charCodeAt(0));
    },
};

export default module;