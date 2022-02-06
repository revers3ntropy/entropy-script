import { Context } from "./context.js";
import { ESError, TypeError } from "../errors.js";
import { Position } from "../position.js";
import { ESArray, ESBoolean, ESFunction, ESNumber, ESObject, ESPrimitive, ESString, ESType, ESUndefined } from "./primitiveTypes.js";
/**
 * Adds the properties of a parent class to an instance of a child class
 * @param {Context} context_ the context of the class definition
 * @param {ESType} class_ the class that the object is currently implementing
 * @param {dict<Primitive>} instance the instance to add the properties to
 * @param {Context} callContext
 * @returns {ESError | void}
 */
function dealWithExtends(context_, class_, instance, callContext) {
    const constructor = instance.constructor;
    if (!class_)
        return;
    if (!(class_ instanceof ESType))
        return new TypeError(Position.unknown, 'Type', typeof class_, class_);
    let setRes = context_.setOwn('super', new ESFunction(({ context }) => {
        var _b;
        const newContext = new Context();
        newContext.parent = context;
        let setRes = newContext.setOwn('type', new ESObject(instance));
        if (setRes instanceof ESError)
            return setRes;
        if (class_.__extends__ !== undefined) {
            let _a = dealWithExtends(newContext, class_.__extends__, instance, callContext);
            if (_a instanceof ESError)
                return _a;
        }
        const res_ = (_b = class_ === null || class_ === void 0 ? void 0 : class_.__init__) === null || _b === void 0 ? void 0 : _b.__call__({ context: callContext });
        if (res_ instanceof ESPrimitive)
            return res_;
    }));
    if (setRes instanceof ESError)
        return setRes;
    const res = createInstance(class_, { context: callContext }, [], false, instance);
    if (res instanceof ESError)
        return res;
    instance = res.valueOf();
    instance.constructor = constructor;
}
/**
 * Instantiates an instance of a type as an object.
 * Simply adds clones of all properties and methods to an empty object
 * @param {ESType} type
 * @param {Context} context
 * @param {Primitive[]} params
 * @param {boolean} runInit
 * @param {dict<Primitive>} on
 * @returns {ESBoolean | Primitive | ESFunction | ESUndefined | ESString | ESObject | ESError | ESNumber | ESArray | ESType}
 */
export function createInstance(type, { context }, params, runInit = true, on = {}) {
    var _b, _c, _d;
    const callContext = context;
    if (type.__isPrimitive__) {
        // make sure we have at least one arg
        if (params.length < 1)
            return new ESUndefined();
        switch (type.__name__) {
            case 'Undefined':
            case 'Type':
                if (params.length < 1)
                    return new ESType();
                else
                    return params[0].typeOf();
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
            case 'Error':
                return new ESError(Position.unknown, 'UserError', params[0].str().valueOf());
            default:
                return ESPrimitive.wrap(params[0]);
        }
    }
    const newContext = new Context();
    newContext.parent = (_b = type.__init__) === null || _b === void 0 ? void 0 : _b.__closure__;
    if (type.__extends__) {
        let _a = dealWithExtends(newContext, type.__extends__, on, callContext);
        if (_a instanceof ESError)
            return _a;
    }
    // @ts-ignore
    on['constructor'] = (_d = (_c = type.__init__) === null || _c === void 0 ? void 0 : _c.clone()) !== null && _d !== void 0 ? _d : new ESUndefined();
    const instance = new ESObject(on);
    for (let method of type.__methods__) {
        const methodClone = method.clone();
        methodClone.this_ = instance;
        on[method.name] = methodClone;
    }
    if (runInit && type.__init__) {
        type.__init__.this_ = instance;
        // newContext, which inherits from the current closure
        type.__init__.__closure__ = newContext;
        const res = type.__init__.__call__({ context: callContext }, ...params);
        // return value of init is ignored
        if (res instanceof ESError)
            return res;
    }
    instance.__type__ = type;
    type.__instances__.push(instance);
    return instance;
}
