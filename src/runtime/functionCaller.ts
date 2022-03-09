import { Node } from "./nodes";
import { Context, generateESFunctionCallContext } from "./context";
import { ESError, TypeError } from "../errors";
import { Position } from "../position";
import {NativeObj} from './primitives/primitive';
import { ESFunction, ESObject, ESPrimitive, ESUndefined, Primitive, types } from "./primitiveTypes";

function callNode (self: ESFunction, context: Context, params: Primitive[], fn: Node) {

    const res = fn.interpret(context);

    if (res.error) return res.error;
    if (res.funcReturn !== undefined) {
        res.val = res.funcReturn;
        res.funcReturn = undefined;
    }

    if (self.returnType.resolve({ context }, res.val?.__type__ ?? types.any).valueOf() === false) {
        return new TypeError(
            Position.void,
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

    if (res instanceof ESError || res instanceof ESPrimitive) {
        return res;
    }

    return new ESUndefined();
}

/**
 * Calls an ESFunction
 * @param {Context} context
 * @param {ESFunction} self
 * @param {Primitive[]} params
 * @returns {ESUndefined | TypeError | ESError | ESPrimitive<any>}
 */
export function call (context: Context, self: ESFunction, params: Primitive[]): ESUndefined | TypeError | ESError | ESPrimitive<NativeObj> {

    // generate context
    let callContext = context;
    context = self.__closure__;
    context.path = callContext.path;
    const fn = self.__value__;

    const newContext = generateESFunctionCallContext(params, self, context);
    if (newContext instanceof ESError) {
        return newContext;
    }

    let this_ = self.this_ ?? new ESObject();

    if (!(this_ instanceof ESObject))
        return new TypeError(
            Position.void,
            'object',
            typeof this_,
            this_,
            '\'this\' must be an object'
        );

    let setRes = newContext.setOwn('this', this_);
    if (setRes instanceof ESError) {
        return setRes;
    }

    if (fn instanceof Node) {
        return callNode(self, newContext, params, fn);

    } else if (typeof fn === 'function') {
        return callNative(self, newContext, params, fn);

    } else {
        return new TypeError(Position.void, 'function', typeof fn);
    }
}