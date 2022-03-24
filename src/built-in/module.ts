import type {ESError} from '../errors';
import type {Context} from '../runtime/context';
import type {NativeObj} from '../runtime/primitives/primitive';
import type {Primitive} from '../runtime/primitiveTypes';
import type {BuiltInFunction, dict} from '../util/util';

export type moduleValues = number | string | moduleValues[] | Primitive | BuiltInFunction;

export type JSModule = dict<moduleValues>;

export type JSModuleParams = {
    context: Context;
    [k: string]: NativeObj;
};

export type JSModuleFunc = (config: JSModuleParams) => JSModule | ESError;