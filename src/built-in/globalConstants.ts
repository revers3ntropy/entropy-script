import {ESBoolean, ESUndefined, Primitive, types} from '../runtime/primitiveTypes.js';

export const globalConstants: {[name: string]: Primitive} = {
    'false': new ESBoolean(false),
    'true': new ESBoolean(true),
    'undefined': new ESUndefined(),

    'any': types.any,
    'number': types.number,
    'string': types.string,
    'bool': types.bool,
    'function': types.function,
    'array': types.array,
    'object': types.object,
    'type': types.type,
    'error': types.error
}
