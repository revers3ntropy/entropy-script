import { Node } from "./nodes.js";
import { generateESFunctionCallContext } from "./context.js";
import { ESError, TypeError } from "../errors.js";
import { Position } from "../position.js";
import { ESObject, ESPrimitive, ESUndefined, types } from "./primitiveTypes.js";
function callNode(self, context, params, fn) {
    var _a, _b, _c, _d;
    const res = fn.interpret(context);
    if (res.error)
        return res.error;
    if (res.funcReturn !== undefined) {
        res.val = res.funcReturn;
        res.funcReturn = undefined;
    }
    if (self.returnType.includesType({ context }, (_b = (_a = res.val) === null || _a === void 0 ? void 0 : _a.__type__) !== null && _b !== void 0 ? _b : types.any).valueOf() === false) {
        return new TypeError(Position.unknown, self.returnType.__name__, ((_c = res.val) === null || _c === void 0 ? void 0 : _c.typeName().valueOf()) || 'undefined', (_d = res.val) === null || _d === void 0 ? void 0 : _d.str().valueOf(), '(from function return)');
    }
    if (res.val) {
        return res.val;
    }
    else {
        return new ESUndefined();
    }
}
function callNative(self, context, params, fn) {
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
export function call(context, self, params) {
    var _a;
    // generate context
    let callContext = context;
    context = self.__closure__;
    context.path = callContext.path;
    const fn = self.__value__;
    const newContext = generateESFunctionCallContext(params, self, context);
    if (newContext instanceof ESError) {
        return newContext;
    }
    let this_ = (_a = self.this_) !== null && _a !== void 0 ? _a : new ESObject();
    if (!(this_ instanceof ESObject))
        return new TypeError(Position.unknown, 'object', typeof this_, this_, '\'this\' must be an object');
    let setRes = newContext.setOwn('this', this_);
    if (setRes instanceof ESError) {
        return setRes;
    }
    if (fn instanceof Node) {
        return callNode(self, newContext, params, fn);
    }
    else if (typeof fn === 'function') {
        return callNative(self, newContext, params, fn);
    }
    else {
        return new TypeError(Position.unknown, 'function', typeof fn);
    }
}
