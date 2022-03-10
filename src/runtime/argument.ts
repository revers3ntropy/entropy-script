import { ESPrimitive, Primitive } from "./primitiveTypes";
import { Context } from "./context";
import { ESError } from "../errors";
import { Node } from "./nodes";

/**
 * The argument which has been populated with Primitive values
 */
export interface runtimeArgument {
    name: string;
    type: Primitive;
    defaultValue?: Primitive;
}

/**
 * The argument data before it has been interpreted
 */
export interface uninterpretedArgument {
    name: string;
    type: Node;
    defaultValue?: Node;
}

/**
 * Converts uninterpretedArgument -> runtimeArgument
 */
export function interpretArgument (arg: uninterpretedArgument, context: Context): runtimeArgument | ESError {
    const typeRes = arg.type.interpret(context);
    if (typeRes.error) {
        return typeRes.error;
    }

    let defaultValue: Primitive | undefined;
    if (arg.defaultValue) {
        let defaultValRes = arg.defaultValue?.interpret(context);
        if (defaultValRes.error) {
            return defaultValRes.error;
        }
        if (defaultValRes.val instanceof ESPrimitive) {
            defaultValue = defaultValRes.val;
        }
    }

    return {
        name: arg.name,
        type: typeRes.val,
        defaultValue
    }
}