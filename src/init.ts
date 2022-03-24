import { addDependencyInjectedBIFs, builtInFunctions } from "./built-in/builtInFunctions";
import { addModule, initModules } from './built-in/builtInModules';
import { Context } from "./runtime/context";
import { ESError } from "./errors";
import { ESFunction, ESJSBinding } from './runtime/primitiveTypes';
import loadGlobalConstants from "./built-in/globalConstants";
import { types } from "./constants";
import { dict } from "./util/util";
import { NativeObj } from "./runtime/primitives/primitive";
import {libs as globalLibs} from "./constants";

export function initialise (
    globalContext: Context,
    printFunc: (...args: string[]) => void,
    inputFunc: (msg: string, cb: (...arg: any[]) => any) => void,
    libs: dict<[NativeObj, boolean]>
): ESError | undefined {

    for (let k of Object.keys(libs)) {
        let [lib, exposed] = libs[k];
        if (exposed) {
            addModule(k, new ESJSBinding(lib));
        }
        globalLibs[k] = lib;
    }

    addDependencyInjectedBIFs(printFunc, inputFunc);

    for (let builtIn in builtInFunctions) {
        const fn = new ESFunction(
            builtInFunctions[builtIn][0],
            [],
            builtIn,
            undefined,
            undefined,
            globalContext,
            true
        );

        fn.info = builtInFunctions[builtIn][1];
        fn.info.name = builtIn;
        fn.info.isBuiltIn = true;
        fn.info.file = 'builtin';

        globalContext.set(builtIn, fn, {
            global: true,
            isConstant: true,
            type: types.function
        });
    }

    loadGlobalConstants(globalContext);

    const initModRes = initModules();
    if (initModRes) {
        return initModRes;
    }

    globalContext.initialisedAsGlobal = true;
}
