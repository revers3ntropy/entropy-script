import {TypeError} from '../../errors';
import Position from '../../position';
import { ESNumber, ESString, Primitive} from '../../runtime/primitiveTypes';
import {str} from '../../util/util';
import type {JSModule} from '../module';

const module: JSModule = {
    asciiToChar: (props, number: Primitive) => {
        if (!(number instanceof ESNumber)) {
            return new TypeError(Position.void, 'number', str(number.typeName()), str(number));
        }
        return new ESString(String.fromCharCode(number.valueOf()));
    },

    charToAscii: (props, char: Primitive) => {
        if (!(char instanceof ESString)) {
            return new TypeError(Position.void, 'string', str(char.typeName()), str(char));
        }
        return new ESNumber(str(char).charCodeAt(0));
    },
};

export default module;