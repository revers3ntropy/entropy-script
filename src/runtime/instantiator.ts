import {primitiveMethods} from '../constants.js';
import { Context } from "./context.js";
import { dict, funcProps } from '../util/util.js';
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
 * @param {ESObject} this_ the 'super' function's 'this' context
 * @returns {ESError | void}
 */
function dealWithExtends (context_: Context, class_: ESType, instance: dict<Primitive>, callContext: Context, this_: ESObject): ESError | void {
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
        newContext.parent = context_;
        /*let setRes = newContext.setOwn('type', new ESObject(instance));
        if (setRes instanceof ESError) {
            return setRes;
        }
         */

        if (class_.__extends__ !== undefined) {
            let _a = dealWithExtends(newContext, class_.__extends__, instance, callContext, this_);
            if (_a instanceof ESError) {
                return _a;
            }
        }

        const initFunc = class_?.__init__?.clone([]);

        if (!initFunc) {
            return;
        }

        initFunc.this_ = this_;

        const res_ = initFunc.__call__({context: newContext}, ...args);
        if (res_ instanceof ESError) {
            return res_;
        }
    }, undefined, 'super', this_);

    let setRes = context_.setOwn('super', superFunc);
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
export function createInstance (type: ESType, {context}: funcProps, params: Primitive[], runInit=true, on: dict<Primitive> = {}): ESError | Primitive {
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
            default:
                return wrap(params[0]);
        }
    }


    const newContext = new Context();
    newContext.parent = type.__init__?.__closure__;

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
            const i: any = instance;
            i[method.name] = ({context}: any, ...args: Primitive[]) =>
                methodClone.__call__({context}, ...args);
        }
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