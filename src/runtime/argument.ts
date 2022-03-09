import { ESPrimitive, ESType, Primitive } from "./primitiveTypes";
import { Context } from "./context";
import { ESError, TypeError } from "../errors";
import { Node } from "./nodes";
import { Position } from "../position";

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
 * @param {uninterpretedArgument} arg
 * @param {Context} context
 * @returns {runtimeArgument|ESError}
 */
export function interpretArgument (arg: uninterpretedArgument, context: Context): runtimeArgument | ESError {
    let type: Primitive;
    const typeRes = arg.type.interpret(context);
    if (typeRes.error)
        return typeRes.error;
    if (typeRes.val instanceof ESType)
        type = typeRes.val;
    else
        return new TypeError(Position.void, 'Type', typeof typeRes.val, typeRes.val, 'Argument can\'t be undefined');

    let defaultValue: Primitive | undefined;
    if (arg.defaultValue) {
        let defaultValRes = arg.defaultValue?.interpret(context);
        if (defaultValRes.error)
            return defaultValRes.error;
        if (defaultValRes.val instanceof ESPrimitive)
            defaultValue = defaultValRes.val;
    }

    return {
        name: arg.name,
        type, defaultValue
    }
}