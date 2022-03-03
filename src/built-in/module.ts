import type {ESError} from '../errors';
import type {Context} from '../runtime/context';
import {NativeObj} from '../runtime/primitives/primitive';
import type {Primitive} from '../runtime/primitiveTypes';
import type {BuiltInFunction} from '../util/util';

type moduleValues = number | string | moduleValues[] | Primitive | BuiltInFunction;

export type JSModule = {[key: string]: moduleValues};

export type JSModuleParams = {
    https?: NativeObj,
    http?: NativeObj,
    fs?: NativeObj,
    mysql?: NativeObj,
    fetch?: NativeObj,
    context?: Context,
    print: (...args: string[]) => void,
    path?: NativeObj,

    [k: string]: NativeObj;
};

export type JSModuleFunc = (config: JSModuleParams) => JSModule | ESError;