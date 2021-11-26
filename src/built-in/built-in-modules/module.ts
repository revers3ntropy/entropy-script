import {Primitive} from '../../runtime/primitiveTypes.js';
import {BuiltInFunction} from '../../util/util.js';

type moduleValues = BuiltInFunction | string | number | Module | Primitive | moduleValues[];
type Module = {
    [key: string]: moduleValues
}
export default Module;