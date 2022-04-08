import { PROPS_TO_OVERRIDE_ON_PRIM, types } from '../util/constants';
import { Context } from "./context";
import type { IFuncProps } from '../util/util';
import { Error, TypeError } from "../errors";
import type {NativeObj} from './primitive';
import {wrap} from './wrapStrip';
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

/**
 * Adds the properties of a parent class to an instance of a child class
 * @param {Context} context
 * @param {ESType} class_ the class that the object is currently extending
 * @param {Primitive} instance the instance to add the properties to
 * @param callContext
 * @returns {Error | void}
 */
function dealWithExtends (context: Context, class_: ESType, instance: ESObject, callContext: Context): Error | void {
    if (!(class_ instanceof ESType)) {
        return new TypeError(
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
            const _a = dealWithExtends(newContext, class_.__extends__, instance, callContext);
            if (_a instanceof Error) {
                return _a;
            }
        }

        const initFunc = class_?.__get_init__();


        if (!initFunc) {
            return;
        }

        initFunc.__this__ = instance;
        initFunc.__closure__ = newContext;

        const res_ = initFunc.__call__({context: newContext}, ...args);
        if (res_ instanceof Error) {
            return res_;
        }
    }, undefined, 'super', instance);

    const initFunc = class_?.__get_init__();

    // copy over arg details to facade 'super' function
    superFunc.__allow_kwargs__ = initFunc?.__allow_kwargs__ || false;
    superFunc.__allow_args__ = initFunc?.__allow_args__ || false;
    superFunc.__args__ = initFunc?.__args__ || [];

    const setRes = context.setOwn('super', superFunc);
    if (setRes instanceof Error) {
        return setRes;
    }

    // recurse with extended class
    const res = createInstance(class_, {context}, [], false, instance);
    if (res instanceof Error) {
        return res;
    }
}

function callPrimordial (params: Primitive[], type: ESType, props: IFuncProps) {
    // make sure we have at least one arg

    switch (type.__name__) {
        case 'Null':
            return new ESUndefined();
        case 'Type':
            if (params.length < 1) {
                return new ESType();
            }
            return new ESString(params[0]?.__type_name__());
        case 'Str':
            if (params.length < 1) {
                return new ESString();
            }
            return params[0].cast(props, types.string);
        case 'Arr':
            if (params.length < 1) {
                return new ESArray();
            }
            const elements: Primitive[] = [];
            for (const arg of params) {
                // array from iterator
                const iter = arg.__iter__(props);
                if (iter instanceof Error) return iter;
                while (true) {
                    const nextRes = iter.__next__(props);
                    if (nextRes instanceof Error) return nextRes;
                    if (nextRes instanceof ESErrorPrimitive && nextRes.__value__?.name === 'EndIterator') {
                        break;
                    }
                    elements.push(nextRes);
                }
            }
            return new ESArray(elements);
        case 'Num':
            if (params.length < 1) {
                return new ESNumber();
            }
            return params[0].cast(props, types.number);
        case 'Func':
            if (params.length < 1) {
                return new ESFunction();
            }
            return params[0].cast(props, types.function);
        case 'Bool':
            if (params.length < 1) {
                return new ESBoolean();
            }
            return params[0].cast(props, types.boolean);
        default:
            return wrap(params[0]);
    }
}

/**
 * Instantiates an instance of a type as an object.
 * Simply adds clones of all properties and methods to an empty object
*/
export function createInstance (
    type: ESType,
    props: IFuncProps,
    params: Primitive[],
    runInit=true,
    instance = new ESObject,
): Error | Primitive {

    const {context} = props;

    if (type.__primordial__) {
        return callPrimordial(params, type, props);
    }

    const __init__ = type.__get_init__();

    const newContext = new Context();
    newContext.parent = __init__?.__closure__;

    if (type.__extends__) {
        const res = dealWithExtends(newContext, type.__extends__, instance, context);
        if (res instanceof Error) {
            return res;
        }
    }

    for (const method of type.__methods__) {
        const methodClone = method.clone();
        methodClone.__this__ = instance;

        instance.__set__(props, new ESString(method.name), methodClone);

        // if it is an operator override method, set it on the primitive rather than the properties object
        if (PROPS_TO_OVERRIDE_ON_PRIM.indexOf(method.name) !== -1) {
            (<NativeObj>instance)[method.name] = methodClone.__call__;
        }
    }

    if (runInit && __init__) {
        __init__.__this__ = instance;

        // newContext, which inherits from the current closure
        __init__.__closure__ = newContext;

        const res = __init__.__call__({context: newContext}, ...params);
        // the return value of init is ignored
        if (res instanceof Error) {
            return res;
        }
    }

    instance.__type__ = type;
    type.__instances__.push(instance);

    return instance;
}