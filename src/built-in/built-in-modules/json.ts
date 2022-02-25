import {Position} from '../../position';
import {strip} from '../../runtime/primitives/wrapStrip';
import {ESNumber, ESObject, ESString} from '../../runtime/primitiveTypes';
import {JSModule} from '../module';
import {str} from '../../util/util';
import {TypeError} from '../../errors';

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