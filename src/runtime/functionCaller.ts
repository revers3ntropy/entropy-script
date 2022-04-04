import { dict, str } from '../util/util';
import { Node } from "./nodes";
import { Context, generateESFunctionCallContext } from "./context";
import { Error, TypeError } from "../errors";
import Position from "../position";
import type {NativeObj} from './primitives/primitive';
import {ESFunction, ESNumber, ESObject, ESPrimitive, ESUndefined, Primitive} from './primitiveTypes';

function callNode (self: ESFunction, context: Context, fn: Node) {

    const res = fn.interpret(context);

    if (res.error) return res.error;
    if (res.funcReturn !== undefined) {
        res.val = res.funcReturn;
        res.funcReturn = undefined;
    }
    let typeCheckRes = self.__returns__.__includes__({ context }, res.val);
    if (typeCheckRes instanceof Error) return typeCheckRes;
    if (typeCheckRes.__value__ === false) {
        return new TypeError(
            Position.void,
            str(self.__returns__),
            res.val?.__type_name__() || 'undefined',
            res.val?.str(new ESNumber).__value__,
            '(from function return)'
        );
    }

    if (res.val) {
        return res.val;
    } else {
        return new ESUndefined();
    }
}

function callNative (self: ESFunction, context: Context, params: Primitive[], fn: Function, kwargs: dict<Primitive>) {
    for (let i = params.length; i < fn.length; i++) {
        params.push(new ESUndefined());
    }

    const res = fn({
        context, kwargs
    }, ...params);

    if (res instanceof Error || res instanceof ESPrimitive) {
        return res;
    }

    return new ESUndefined();
}

/**
 * Calls an ESFunction
 */
export function call (
    context: Context,
    self: ESFunction,
    params: Primitive[] = [],
    kwargs: dict<Primitive> = {}
): ESUndefined | Error | ESPrimitive<NativeObj> {

    // generate context
    let callContext = context;
    if (!self.takeCallContextAsClosure) {
        context = self.__closure__;
    }
    context.path = callContext.path;
    const fn = self.__value__;

    const newContext = generateESFunctionCallContext(self, params, kwargs, context);
    if (newContext instanceof Error) {
        return newContext;
    }

    let this_ = self.__this__ ?? new ESObject();

    let setRes = newContext.setOwn('this', this_);
    if (setRes instanceof Error) {
        return setRes;
    }

    if (fn instanceof Node) {
        return callNode(self, newContext, fn);

    } else if (typeof fn === 'function') {
        return callNative(self, newContext, params, fn, kwargs);

    } else {
        return new TypeError(Position.void, 'function', typeof fn);
    }
}