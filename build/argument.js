import { ESPrimitive, ESType } from "./primitiveTypes.js";
import { TypeError } from "./errors.js";
import { Position } from "./position.js";
/**
 * Converts uninterpretedArgument -> runtimeArgument
 * @param {uninterpretedArgument} arg
 * @param {Context} context
 * @returns {runtimeArgument|ESError}
 */
export function interpretArgument(arg, context) {
    var _a;
    let type;
    const typeRes = arg.type.interpret(context);
    if (typeRes.error)
        return typeRes.error;
    if (typeRes.val instanceof ESType)
        type = typeRes.val;
    else
        return new TypeError(Position.unknown, 'Type', typeof typeRes.val, typeRes.val, 'Argument can\'t be undefined');
    let defaultValue;
    if (arg.defaultValue) {
        let defaultValRes = (_a = arg.defaultValue) === null || _a === void 0 ? void 0 : _a.interpret(context);
        if (defaultValRes.error)
            return defaultValRes.error;
        if (defaultValRes.val instanceof ESPrimitive)
            defaultValue = defaultValRes.val;
    }
    return {
        name: arg.name,
        type, defaultValue
    };
}
