import {primitiveMethods, types} from '../util/constants';
import { Context } from "./context";
import type { dict, funcProps } from '../util/util';
import { EndIterator, Error, TypeError } from "../errors";
import Position from "../position";
import type {NativeObj} from './primitives/primitive';
import {wrap} from './primitives/wrapStrip';
import {
    ESArray,
    ESBoolean, ESErrorPrimitive,
    ESFunction,
    ESNumber,
    ESObject,
    ESString, ESType,
    ESUndefined,
    Primitive
} from "./primitiveTypes";
import { str } from "../util/util";

/**
 * Adds the properties of a parent class to an instance of a child class
 * @param {Context} context
 * @param {ESType} class_ the class that the object is currently extending
 * @param {dict<Primitive>} instance the instance to add the properties to
 * @param {ESObject} this_ the 'super' function's 'this' context
 * @param callContext
 * @returns {Error | void}
 */
function dealWithExtends (context: Context, class_: ESType, instance: dict<Primitive>, this_: ESObject, callContext: Context): Error | void {
    if (!(class_ instanceof ESType)) {
        return new TypeError(
            Position.void,
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
            if (_a instanceof Error) {
                return _a;
            }
        }

        const initFunc = class_?.__init__;

        if (!initFunc) {
            return;
        }

        initFunc.__this__ = this_;
        initFunc.__closure__ = newContext;

        const res_ = initFunc.__call__({context: newContext}, ...args);
        if (res_ instanceof Error) {
            return res_;
        }
    }, undefined, 'super', this_);

    // copy over arg details to facade 'super' function
    superFunc.__allow_kwargs__ = class_?.__init__?.__allow_kwargs__ || false;
    superFunc.__allow_args__ = class_?.__init__?.__allow_args__ || false;
    superFunc.__args__ = class_?.__init__?.__args__ || [];

    let setRes = context.setOwn('super', superFunc);
    if (setRes instanceof Error) {
        return setRes;
    }

    // recurse with extended class
    const res = createInstance(class_, {context}, [], false, instance);
    if (res instanceof Error) {
        return res;
    }
}

function callPrimordial (params: Primitive[], type: ESType, props: funcProps) {
    // make sure we have at least one arg

    switch (type.__name__) {
        case 'Null':
            return new ESUndefined();
        case 'Type':
            if (params.length < 1) {
                return new ESType();
            } else {
                return new ESString(params[0]?.typeName());
            }
        case 'Str':
            return params[0].cast(props, types.string);
        case 'Arr':
            if (params.length < 1) {
                return new ESArray();
            }
            let elements: Primitive[] = [];
            for (let arg of params) {
                // array from iterator
                let iter = arg.__iter__(props);
                if (iter instanceof Error) return iter;
                while (true) {
                    let nextRes = iter.__next__(props);
                    if (nextRes instanceof Error) return nextRes;
                    if (nextRes instanceof ESErrorPrimitive && nextRes.__value__ instanceof EndIterator) {
                        break;
                    }
                    elements.push(nextRes);
                }
            }
            return new ESArray(elements);
        case 'Num':
            return params[0].cast(props, types.number);
        case 'Func':
            return params[0].cast(props, types.function);
        case 'Bool':
            return params[0].cast(props, types.boolean);
        default:
            return wrap(params[0]);
    }
}

/**
 * Instantiates an instance of a type as an object.
 * Simply adds clones of all properties and methods to an empty object
 * @param {ESType} type
 * @param {Primitive[]} params
 * @param {boolean} runInit
 * @param {dict<Primitive>} on
 * @returns {ESBoolean | Primitive | ESFunction | ESUndefined | ESString | ESObject | Error | ESNumber | ESArray | ESType}
 */
export function createInstance (
    type: ESType,
    props: funcProps,
    params: Primitive[],
    runInit=true,
    on: dict<Primitive> = {}
): Error | Primitive {

    const {context} = props;

    if (type.__primordial__) {
        return callPrimordial(params, type, props);
    }

    const newContext = new Context();
    newContext.parent = type.__init__?.__closure__;

    const instance = new ESObject();

    if (type.__extends__) {
        let res = dealWithExtends(newContext, type.__extends__, on, instance, context);
        if (res instanceof Error) {
            return res;
        }
    }

    instance.__value__ = on;

    for (let method of type.__methods__) {
        const methodClone = method.clone();
        methodClone.__this__ = instance;

        on[method.name] = methodClone;

        // if it is an operator override method, set it on the primitive rather than the properties object
        if (primitiveMethods.indexOf(method.name) !== -1) {
            (<NativeObj>instance)[method.name] = methodClone.__call__;
        }
    }

    if (runInit && type.__init__) {
        type.__init__.__this__ = instance;

        // newContext, which inherits from the current closure
        type.__init__.__closure__ = newContext;

        const res = type.__init__.__call__({context: newContext}, ...params);
        // the return value of init is ignored
        if (res instanceof Error) {
            return res;
        }
    }

    instance.__type__ = type;
    type.__instances__.push(instance);

    return instance;
}