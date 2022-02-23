import {Position} from '../../position.js';
import {strip} from '../../runtime/primitives/wrapStrip.js';
import {ESNumber, ESObject, ESString} from '../../runtime/primitiveTypes.js';
import {JSModule} from '../module.js';
import {str} from '../../util/util.js';
import {TypeError} from '../../errors.js';

const module: JSModule = {

    parse: (props, json) => {
        return new ESObject(JSON.parse(str(json)));
    },

    stringify: (props, json) => {
        if (!(json instanceof ESObject)) {
            return new TypeError(Position.unknown, 'object', str(json.typeName()), str(json));
        }

        return new ESString(JSON.stringify(strip(json, props)));
    }
};

export default module;