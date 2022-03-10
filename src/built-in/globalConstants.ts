import { ESBoolean, ESUndefined, Primitive } from '../runtime/primitiveTypes';
import { Context } from "../runtime/context";
import { types } from "../constants";

export default function load (context: Context) {
    const globalConstants: {[k: string]: Primitive} = {
        'false': new ESBoolean(false),
        'true': new ESBoolean(true),
        'nil': new ESUndefined(),
        'any': types.any,
        'number': types.number,
        'string': types.string,
        'bool': types.bool,
        'function': types.function,
        'array': types.array,
        'object': types.object,
        'type': types.type,
        'error': types.error,
        'undefined': types.undefined
    };

    for (let constant in globalConstants) {
        const value = globalConstants[constant];
        context.set(constant, value, {
            global: true,
            isConstant: true
        });
    }
}


