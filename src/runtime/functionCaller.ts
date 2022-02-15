import { Node } from "./nodes.js";
import { Context, generateESFunctionCallContext } from "./context.js";
import { ESError, TypeError } from "../errors.js";
import { Position } from "../position.js";
import { ESFunction, ESObject, ESPrimitive, ESUndefined, Primitive, types } from "./primitiveTypes.js";

function callNode (self: ESFunction, context: Context, params: Primitive[], fn: Node) {

    const newContext = generateESFunctionCallContext(params, self, context);
    if (newContext instanceof ESError) return newContext;

    let this_ = self.this_ ?? new ESObject();

    if (!(this_ instanceof ESObject))
        return new TypeError(
            Position.unknown,
            'object',
            typeof this_,
            this_,
            '\'this\' must be an object'
        );

    let setRes = newContext.set('this', this_);
    if (setRes instanceof ESError) return setRes;

    const res = fn.interpret(newContext);

    if (res.error) return res.error;
    if (res.funcReturn !== undefined) {
        res.val = res.funcReturn;
        res.funcReturn = undefined;
    }

    if (self.returnType.includesType({ context }, res.val?.__type__ ?? types.any).valueOf() === false) {
        return new TypeError(
            Position.unknown,
            self.returnType.__name__,
            res.val?.typeName().valueOf() || 'undefined',
            res.val?.str().valueOf(),
            '(from function return)');
    }

    if (res.val) {
        return res.val;
    } else {
        return new ESUndefined();
    }
}

function callNative (self: ESFunction, context: Context, params: Primitive[], fn: Function) {
    for (let i = params.length; i < fn.length; i++)
        params.push(new ESUndefined());
    const res = fn({
        context
    }, ...params);
    if (res instanceof ESError || res instanceof ESPrimitive) return res;
    return new ESUndefined();
}

/**
 * Calls an ESFunction
 * @param {Context} context
 * @param {ESFunction} self
 * @param {Primitive[]} params
 * @returns {ESUndefined | TypeError | ESError | ESPrimitive<any>}
 */
export function call (context: Context, self: ESFunction, params: Primitive[]) {

    // generate context
    let callContext = context;
    context = self.__closure__;
    context.path = callContext.path;
    const fn = self.__value__;

    if (fn instanceof Node) {
        return callNode(self, context, params, fn);

    } else if (typeof fn === 'function') {
        return callNative(self, context, params, fn);

    } else {
        return new TypeError(Position.unknown, 'function', typeof fn);
    }
}