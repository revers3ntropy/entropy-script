import { Position } from '../../position.js';
import { strip } from '../../runtime/primitives/wrapStrip.js';
import { ESNumber, ESObject, ESString } from '../../runtime/primitiveTypes.js';
import { str } from '../../util/util.js';
import { TypeError } from '../../errors.js';
const module = {
    parse: (props, json) => {
        return new ESObject(JSON.parse(str(json)));
    },
    stringify: (props, json, whitespaceLevel = new ESNumber(0)) => {
        if (!(json instanceof ESObject)) {
            return new TypeError(Position.unknown, 'object', str(json.typeName()), str(json));
        }
        if (!(whitespaceLevel instanceof ESNumber)) {
            return new TypeError(Position.unknown, 'number', whitespaceLevel.typeName(), str(whitespaceLevel));
        }
        return new ESString(JSON.stringify(strip(json, props), whitespaceLevel.valueOf));
    }
};
export default module;
