import { ESBoolean, ESJSBinding, ESNumber, ESUndefined, Primitive } from '../runtime/primitiveTypes';
import type { Context } from "../runtime/context";
import { types } from "../util/constants";
import type { dict } from "../util/util";

import * as errors from '../errors';

export default function load (context: Context) {

    // must be declared inside function as get import error otherwise
    const globalConstants: dict<Primitive> = {
        'false': new ESBoolean(false),
        'true': new ESBoolean(true),
        'nil': new ESUndefined(),
        'inf': new ESNumber(Infinity),
        'Any': types.any,
        'Number': types.number,
        'String': types.string,
        'Bool': types.bool,
        'Func': types.function,
        'Array': types.array,
        'Object': types.object,
        'Type': types.type,
        'Error': types.error,
        'Undefined': types.undefined
    };

    for (let cls of Object.keys(errors)) {
        globalConstants[cls] = new ESJSBinding((errors as any)[cls], cls, false, true);
    }

    for (let constant in globalConstants) {
        const value = globalConstants[constant];
        context.set(constant, value, {
            global: true,
            isConstant: true
        });
    }
}


