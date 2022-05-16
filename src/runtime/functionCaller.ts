import { Map, NativeObj, str } from '../util/util';
import { Node } from "./nodes";
import { Context, generateESFunctionCallContext } from "./context";
import { Error, TypeError } from "../errors";
import { ESFunction, ESNumber, ESObject, ESPrimitive, ESNull, Primitive } from './primitiveTypes';

function callNode (self: ESFunction, context: Context, fn: Node, dontTypeCheck: boolean) {

    const res = fn.interpret(context);

    if (res.error) return res.error;
    if (res.funcReturn !== undefined) {
        res.val = res.funcReturn;
        res.funcReturn = undefined;
    }

    if (!dontTypeCheck) {
        const typeCheckRes = self.__returns__.__includes__({ context }, res.val);
        if (typeCheckRes instanceof Error) return typeCheckRes;
        if (typeCheckRes.__value__ === false) {
            return new TypeError(
                str(self.__returns__),
                res.val?.__type_name__() || 'undefined',
                res.val?.str({context}, new ESNumber).__value__,
                '(from function return)'
            );
        }
    }

    if (res.val) {
        return res.val;
    } else {
        return new ESNull();
    }
}

function callNative (self: ESFunction, context: Context, params: Primitive[], fn: (...args: any[]) => any, kwargs: Map<Primitive>, dontTypeCheck: boolean) {
    for (let i = params.length; i < fn.length; i++) {
        params.push(new ESNull());
    }

    const res = fn({
        context,
        kwargs,
        dontTypeCheck
    }, ...params);

    if (res instanceof Error || res instanceof ESPrimitive) {
        return res;
    }

    return new ESNull();
}

/**
 * Calls an ESFunction
 */
export function call (
    context: Context,
    self: ESFunction,
    params: Primitive[] = [],
    kwargs: Map<Primitive> = {},
    dontTypeCheck = false
): ESNull | Error | ESPrimitive<NativeObj> {

    // generate context
    const callContext = context;
    if (!self.takeCallContextAsClosure) {
        context = self.__closure__;
    }
    context.path = callContext.path;
    const fn = self.__value__;

    const newContext = generateESFunctionCallContext(self, params, kwargs, context, dontTypeCheck);
    if (newContext instanceof Error) {
        return newContext;
    }

    const this_ = self.__this__ ?? new ESObject();

    const setRes = newContext.setOwn('this', this_);
    if (setRes instanceof Error) {
        return setRes;
    }

    if (fn instanceof Node) {
        return callNode(self, newContext, fn, dontTypeCheck);

    } else if (typeof fn === 'function') {
        return callNative(self, newContext, params, fn, kwargs, dontTypeCheck);

    } else {
        return new TypeError('function', typeof fn);
    }
}