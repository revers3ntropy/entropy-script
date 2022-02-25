import {primitiveMethods} from '../constants';
import { Context } from "./context";
import { dict, funcProps } from '../util/util';
import { ESError, TypeError } from "../errors";
import { Position } from "../position";
import {NativeObj} from './primitives/primitive';
import {wrap} from './primitives/wrapStrip';
import {
    ESArray,
    ESBoolean,
    ESFunction,
    ESNumber,
    ESObject,
    ESString, ESType,
    ESUndefined,
    Primitive
} from "./primitiveTypes";

/**
 * Adds the properties of a parent class to an instance of a child class
 * @param {Context} context
 * @param {ESType} class_ the class that the object is currently extending
 * @param {dict<Primitive>} instance the instance to add the properties to
 * @param {ESObject} this_ the 'super' function's 'this' context
 * @param callContext
 * @returns {ESError | void}
 */
function dealWithExtends (context: Context, class_: ESType, instance: dict<Primitive>, this_: ESObject, callContext: Context): ESError | void {
    if (!(class_ instanceof ESType)) {
        return new TypeError(
            Position.unknown,
            'Type',
            typeof class_,
            class_
        );
    }

    const superFunc = new ESFunction(({context}, ...args) => {
        const newContext = new Context();
        newContext.parent = context;
        // deal with next level
        if (class_.__extends__) {
            let _a = dealWithExtends(newContext, class_.__extends__, instance, this_, callContext);
            if (_a instanceof ESError) {
                return _a;
            }
        }

        const initFunc = class_?.__init__;

        if (!initFunc) {
            return;
        }

        initFunc.this_ = this_;
        initFunc.__closure__ = newContext;

        const res_ = initFunc.__call__({context: newContext}, ...args);
        if (res_ instanceof ESError) {
            return res_;
        }
    }, undefined, 'super', this_);

    let setRes = context.setOwn('super', superFunc);
    if (setRes instanceof ESError) {
        return setRes;
    }

    // recurse with extended class
    const res = createInstance(class_, {context}, [], false, instance);
    if (res instanceof ESError) {
        return res;
    }
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
export function createInstance (
    type: ESType,
    {context}: funcProps,
    params: Primitive[],
    runInit=true,
    on: dict<Primitive> = {}
): ESError | Primitive {

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
            default:
                return wrap(params[0]);
        }
    }


    const newContext = new Context();
    newContext.parent = type.__init__?.__closure__;

    const instance = new ESObject();

    if (type.__extends__) {
        let res = dealWithExtends(newContext, type.__extends__, on, instance, context);
        if (res instanceof ESError) {
            return res;
        }
    }

    instance.__value__ = on;

    for (let method of type.__methods__) {
        const methodClone = method.clone();
        methodClone.this_ = instance;
        on[method.name] = methodClone;

        if (primitiveMethods.indexOf(method.name) !== -1) {
            (<NativeObj>instance)[method.name] = methodClone.__call__;
        }
    }

    if (runInit && type.__init__) {
        type.__init__.this_ = instance;

        // newContext, which inherits from the current closure
        type.__init__.__closure__ = newContext;

        const res = type.__init__.__call__({context: newContext}, ...params);
        // return value of init is ignored
        if (res instanceof ESError) {
            return res;
        }
    }

    instance.__type__ = type;
    type.__instances__.push(instance);

    return instance;
}