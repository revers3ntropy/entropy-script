import {Position} from '../../position.js';
import {ESNumber, ESObject, ESPrimitive, ESString} from '../../runtime/primitiveTypes.js';
import {JSModule} from './module.js';
import {str} from '../../util/util.js';
import {TypeError} from '../../errors.js';

const module: JSModule = {
    parse: ({}, json) => {
        return new ESObject(JSON.parse(str(json)));
    },
    stringify: ({}, json, whitespaceLevel= new ESNumber(0)) => {
        if (!(json instanceof ESObject))
            return new TypeError(Position.unknown, 'object', str(json.typeOf()), str(json));
        if (!(whitespaceLevel instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(whitespaceLevel.typeOf()), str(whitespaceLevel));
        return new ESString(JSON.stringify(ESPrimitive.strip(json), whitespaceLevel.valueOf));
    }
};

export default module;