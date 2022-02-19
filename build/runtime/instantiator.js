import { primitiveMethods } from '../constants.js';
import { Context } from "./context.js";
import { ESError, TypeError } from "../errors.js";
import { Position } from "../position.js";
import { wrap } from './primitives/wrapStrip.js';
import { ESArray, ESBoolean, ESFunction, ESNumber, ESObject, ESString, ESType, ESUndefined } from "./primitiveTypes.js";
function dealWithExtends(context_, class_, instance, callContext, this_) {
    if (!(class_ instanceof ESType)) {
        return new TypeError(Position.unknown, 'Type', typeof class_, class_);
    }
    const superFunc = new ESFunction(({ context }, ...args) => {
        var _b;
        const newContext = new Context();
        newContext.parent = context_;
        if (class_.__extends__ !== undefined) {
            let _a = dealWithExtends(newContext, class_.__extends__, instance, callContext, this_);
            if (_a instanceof ESError) {
                return _a;
            }
        }
        const initFunc = (_b = class_ === null || class_ === void 0 ? void 0 : class_.__init__) === null || _b === void 0 ? void 0 : _b.clone([]);
        if (!initFunc) {
            return;
        }
        initFunc.this_ = this_;
        const res_ = initFunc.__call__({ context: newContext }, ...args);
        if (res_ instanceof ESError) {
            return res_;
        }
    }, undefined, 'super', this_);
    let setRes = context_.setOwn('super', superFunc);
    if (setRes instanceof ESError) {
        return setRes;
    }
    const res = createInstance(class_, { context: callContext }, [], false, instance);
    if (res instanceof ESError) {
        return res;
    }
    instance = res.valueOf();
}
export function createInstance(type, { context }, params, runInit = true, on = {}) {
    var _b;
    const callContext = context;
    if (type.__isPrimitive__) {
        if (params.length < 1) {
            return new ESUndefined();
        }
        switch (type.__name__) {
            case 'Undefined':
            case 'Type':
                if (params.length < 1) {
                    return new ESType();
                }
                else {
                    return new ESString(params[0].__type__.__name__);
                }
            case 'String':
                return new ESString(params[0].str().valueOf());
            case 'Array':
                return new ESArray(params);
            case 'Number':
                return new ESNumber(params[0].valueOf());
            case 'Function':
                return new ESFunction(params[0].valueOf());
            case 'Boolean':
                return new ESBoolean(params[0].bool().valueOf());
            case 'Object':
                return new ESObject(params[0]);
            default:
                return wrap(params[0]);
        }
    }
    const newContext = new Context();
    newContext.parent = (_b = type.__init__) === null || _b === void 0 ? void 0 : _b.__closure__;
    const instance = new ESObject();
    if (type.__extends__) {
        let res = dealWithExtends(newContext, type.__extends__, on, callContext, instance);
        if (res instanceof ESError) {
            return res;
        }
    }
    instance.__value__ = on;
    for (let method of type.__methods__) {
        const methodClone = method.clone([]);
        methodClone.this_ = instance;
        on[method.name] = methodClone;
        if (primitiveMethods.indexOf(method.name) !== -1) {
            const i = instance;
            i[method.name] = ({ context }, ...args) => methodClone.__call__({ context }, ...args);
        }
    }
    if (runInit && type.__init__) {
        type.__init__.this_ = instance;
        type.__init__.__closure__ = newContext;
        const res = type.__init__.__call__({ context: callContext }, ...params);
        if (res instanceof ESError) {
            return res;
        }
    }
    instance.__type__ = type;
    type.__instances__.push(instance);
    return instance;
}
