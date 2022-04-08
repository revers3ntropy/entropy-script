import { ESPrimitive, Primitive } from "./primitiveTypes";
import { Context } from "./context";
import { Error } from "../errors";
import { Node } from "./nodes";

/**
 * The argument which has been populated with Primitive values
 */
export interface IRuntimeArgument {
    name: string;
    type: Primitive;
    defaultValue?: Primitive;
    isKwarg?: boolean;
}

/**
 * The argument data before it has been interpreted
 */
export interface IUninterpretedArgument {
    name: string;
    type: Node;
    defaultValue?: Node;
    isKwarg?: boolean;
}

/**
 * Converts uninterpretedArgument -> runtimeArgument
 */
export function interpretArgument (arg: IUninterpretedArgument, context: Context): IRuntimeArgument | Error {
    const typeRes = arg.type.interpret(context);
    if (typeRes.error) {
        return typeRes.error;
    }

    let defaultValue: Primitive | undefined;
    if (arg.defaultValue) {
        const defaultValRes = arg.defaultValue?.interpret(context);
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
        defaultValue,
        isKwarg: arg.isKwarg
    };
}