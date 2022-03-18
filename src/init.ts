import { addDependencyInjectedBIFs, builtInFunctions } from "./built-in/builtInFunctions";
import {initModules} from './built-in/builtInModules';
import { Context } from "./runtime/context";
import { ESError } from "./errors";
import {ESFunction} from './runtime/primitiveTypes';
import loadGlobalConstants from "./built-in/globalConstants";

export function initialise (
    globalContext: Context,
    printFunc: (...args: string[]) => void,
    inputFunc: (msg: string, cb: (...arg: any[]) => any) => void
): ESError | undefined {
    addDependencyInjectedBIFs(printFunc, inputFunc);

    for (let builtIn in builtInFunctions) {
        const fn = new ESFunction(builtInFunctions[builtIn][0], [], builtIn, undefined, undefined, globalContext);

        fn.info = builtInFunctions[builtIn][1];
        fn.info.name = builtIn;
        fn.info.isBuiltIn = true;
        fn.info.file = 'built-in';

        globalContext.set(builtIn, fn, {
            global: true,
            isConstant: true
        });
    }

    loadGlobalConstants(globalContext);

    const initModRes = initModules();
    if (initModRes) {
        return initModRes;
    }

    globalContext.initialisedAsGlobal = true;
}
