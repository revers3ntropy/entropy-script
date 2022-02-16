import type {ESError} from '../errors.js';
import type {Context} from '../runtime/context.js';
import type {Primitive} from '../runtime/primitiveTypes.js';
import type {BuiltInFunction} from '../util/util.js';

type moduleValues = number | string | moduleValues[] | Primitive | BuiltInFunction;
export type JSModule = {[key: string]: moduleValues};
export type JSModuleParams = {
    https: any,
    http: any,
    fs: any,
    mysql: any,
    fetch: any,
    context: Context,
    print: (...args: string[]) => void,
    path: any
};
export type JSModuleFunc = (config: JSModuleParams) => JSModule | ESError;