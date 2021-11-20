import {ESBoolean, ESUndefined, Primitive, types} from "../runtime/primitiveTypes.js";

export const ESTrue = new ESBoolean(true);
export const ESFalse = new ESBoolean(false);


export const globalConstants: {[name: string]: Primitive} = {
    'false': ESFalse,
    'true': ESTrue,
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