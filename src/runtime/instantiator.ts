import { Context } from "./context.js";
import { dict } from "../util/util.js";
import { ESError, TypeError } from "../errors.js";
import { Position } from "../position.js";
import {wrap} from './primitives/wrapStrip.js';
import {
    ESArray,
    ESBoolean,
    ESFunction,
    ESNumber,
    ESObject, ESPrimitive,
    ESString, ESType,
    ESUndefined,
    Primitive
} from "./primitiveTypes.js";

/**
 * Adds the properties of a parent class to an instance of a child class
 * @param {Context} context_ the context of the class definition
 * @param {ESType} class_ the class that the object is currently implementing
 * @param {dict<Primitive>} instance the instance to add the properties to
 * @param {Context} callContext
 * @returns {ESError | void}
 */
function dealWithExtends (context_: Context, class_: ESType, instance: dict<Primitive>, callContext: Context): ESError | void {
    if (!class_) {
        return;
    }
    if (!(class_ instanceof ESType)) {
        return new TypeError(
            Position.unknown,
            'Type',
            typeof class_,
            class_
        );
    }

    let setRes = context_.setOwn('super', new ESFunction(({context}) => {
        const newContext = new Context();
        newContext.parent = context;
        let setRes = newContext.setOwn('type', new ESObject(instance));
        if (setRes instanceof ESError) {
            return setRes;
        }

        if (class_.__extends__ !== undefined) {
            let _a = dealWithExtends(newContext, class_.__extends__, instance, callContext);
            if (_a instanceof ESError) {
                return _a;
            }
        }

        const res_ = class_?.__init__?.__call__({context: callContext});
        if (res_ instanceof ESPrimitive) {
            return res_;
        }
    }));
    if (setRes instanceof ESError) {
        return setRes;
    }

    const res = createInstance(class_, {context: callContext}, [], false, instance);
    if (res instanceof ESError) {
        return res;
    }
    instance = res.valueOf();
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
export function createInstance (type: ESType, {context}: {context: Context}, params: Primitive[], runInit=true, on: dict<Primitive> = {}): ESError | Primitive {
    const callContext = context;

    if (type.__isPrimitive__) {
        // make sure we have at least one arg
        if (params.length < 1) {
            return new ESUndefined();
        }

        switch (type.__name__) {
            case 'Undefined':
            case 'Type':
                if (params.length < 1) {
                    return new ESType();
                } else {
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
                return new ESObject(<dict<any>>params[0]);
            case 'Error':
                return new ESError(Position.unknown, 'UserError', params[0].str().valueOf());
            default:
                return wrap(params[0]);
        }
    }


    const newContext = new Context();
    newContext.parent = type.__init__?.__closure__;

    if (type.__extends__) {
        let res = dealWithExtends(newContext, type.__extends__, on, callContext);
        if (res instanceof ESError) {
            return res;
        }
    }

    const instance = new ESObject(on);

    for (let method of type.__methods__) {
        const methodClone = method.clone([]);
        methodClone.this_ = instance;
        on[method.name] = methodClone;
    }

    if (runInit && type.__init__) {
        type.__init__.this_ = instance;

        // newContext, which inherits from the current closure
        type.__init__.__closure__ = newContext;

        const res = type.__init__.__call__({context: callContext}, ...params);
        // return value of init is ignored
        if (res instanceof ESError) {
            return res;
        }
    }

    instance.__type__ = type;

    type.__instances__.push(instance);

    return instance;
}