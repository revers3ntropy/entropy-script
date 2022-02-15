import { TypeError } from '../../errors.js';
import { Position } from '../../position.js';
import { ESNumber, ESString } from '../../runtime/primitiveTypes.js';
import { str } from '../../util/util.js';
const module = {
    asciiToChar: ({}, number) => {
        if (!(number instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(number.typeName()), str(number));
        return new ESString(String.fromCharCode(number.valueOf()));
    },
    charToAscii: ({}, char) => {
        if (!(char instanceof ESString))
            return new TypeError(Position.unknown, 'string', str(char.typeName()), str(char));
        return new ESNumber(str(char).charCodeAt(0));
    },
};
export default module;
