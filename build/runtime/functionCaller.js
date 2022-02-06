import { Node } from "./nodes.js";
import { generateESFunctionCallContext } from "./context.js";
import { ESError, TypeError } from "../errors.js";
import { Position } from "../position.js";
import { ESObject, ESPrimitive, ESUndefined, types } from "./primitiveTypes.js";
function callNode(self, context, params, fn) {
    var _a, _b, _c, _d, _e;
    const newContext = generateESFunctionCallContext(params, self, context);
    if (newContext instanceof ESError)
        return newContext;
    let this_ = (_a = self.this_) !== null && _a !== void 0 ? _a : new ESObject();
    if (!(this_ instanceof ESObject))
        return new TypeError(Position.unknown, 'object', typeof this_, this_, '\'this\' must be an object');
    let setRes = newContext.set('this', this_);
    if (setRes instanceof ESError)
        return setRes;
    const res = fn.interpret(newContext);
    if (res.error)
        return res.error;
    if (res.funcReturn !== undefined) {
        res.val = res.funcReturn;
        res.funcReturn = undefined;
    }
    if (self.returnType.includesType({ context }, (_c = (_b = res.val) === null || _b === void 0 ? void 0 : _b.__type__) !== null && _c !== void 0 ? _c : types.any).valueOf() === false) {
        return new TypeError(Position.unknown, self.returnType.__name__, ((_d = res.val) === null || _d === void 0 ? void 0 : _d.typeOf().valueOf()) || 'undefined', (_e = res.val) === null || _e === void 0 ? void 0 : _e.str().valueOf(), '(from function return)');
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
    if (res instanceof ESError || res instanceof ESPrimitive)
        return res;
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
    // generate context
    let callContext = context;
    context = self.__closure__;
    context.path = callContext.path;
    const fn = self.__value__;
    if (fn instanceof Node) {
        return callNode(self, context, params, fn);
    }
    else if (typeof fn === 'function') {
        return callNative(self, context, params, fn);
    }
    else {
        return new TypeError(Position.unknown, 'function', typeof fn);
    }
}
