import { addDependencyInjectedBIFs, builtInFunctions } from "./built-in/builtInFunctions";
import { addModule, initModules } from './built-in/builtInModules';
import { preloadModules } from './built-in/module';
import addNodeBIFs from './built-in/nodeLibs';
import { IS_NODE_INSTANCE, NativeObj, run } from './index';
import { Context } from "./runtime/context";
import { Error } from "./errors";
import { ESFunction, ESJSBinding, ESNull, initPrimitiveTypes } from './runtime/primitiveTypes';
import loadGlobalConstants from "./built-in/globalConstants";
import { GLOBAL_CTX, refreshPerformanceNow, runningInNode, setGlobalContext, STD_RAW, types } from './util/constants';
import { Map } from "./util/util";
import { libs as globalLibs } from "./util/constants";
import { IRuntimeArgument } from "./runtime/argument";
import { config } from "./config";

/**
 * Top level initialise function, which does a bunch on initialisation:
 * - Setting global context
 * - Setting the primitive types
 * - Sorting out JS injected libraries
 * - Adds built-in functions and constants to the global context
 * - Adds built-in modules
 * - Runs STD code
 * - and a few more little things
 */
export default async function init ({
  print = console.log,
  input = () => void 0,
  node = undefined,
  context = new Context(),
  path = '',
  libs = {}
}: {
    print?: (...args: any[]) => void,
    input?: (msg: string, cb: (...arg: any[]) => any) => void,
    node?: boolean,
    context?: Context,
    path?: string,
    libs?: Map<[NativeObj, boolean]>
} = {}): Promise<Error | Context> {

    setGlobalContext(context);

    initPrimitiveTypes();

    for (const k of Object.keys(libs)) {
        if (!Array.isArray(libs[k]) || libs[k].length !== 2) {
            throw `lib ${k} is not of type [any, boolean]`;
        }
        const [lib, exposed] = libs[k];
        if (typeof exposed !== 'boolean') {
            throw `lib ${k} is not of type [any, boolean]`;
        }
        if (exposed) {
            addModule(k, new ESJSBinding(lib));
        }
        globalLibs[k] = lib;
    }

    addDependencyInjectedBIFs(print, input);

    for (const builtIn in builtInFunctions) {
        const [rawFn, info] = builtInFunctions[builtIn];

        const numArgs = info.args?.length ?? rawFn.length-1;
        const args: IRuntimeArgument[] = (new Array(numArgs))
            .fill({
                name: 'unknown',
                type: types.any,
                defaultValue: new ESNull()
            } as IRuntimeArgument);

        const fn = new ESFunction(
            rawFn,
            // if we are allowing args, then don't make it default the args to nil
            info.allow_args ? [] : args,
            builtIn,
            undefined,
            undefined,
            context,
            true,
            info.allow_args,
            info.allow_kwargs
        );

        if (info.allow_args) {
            fn.__allow_args__ = true;
        }
        fn.__info__ = info;
        fn.__info__.name = builtIn;
        fn.__info__.builtin = true;
        fn.__info__.file = 'builtin';

        context.set(builtIn, fn, {
            global: true,
            isConstant: true,
            type: types.function
        });
    }

    loadGlobalConstants(context);

    const initModRes = initModules();
    if (initModRes) {
        return initModRes;
    }

    context.initialisedAsGlobal = true;

    if (path) {
        context.path = path;
    }

    if (node ?? IS_NODE_INSTANCE) {
        runningInNode();
        await refreshPerformanceNow(true);
        addNodeBIFs(context);
    }

    const modulePreloadRes = await preloadModules(config.modules);
    if (modulePreloadRes instanceof Error) {
        return modulePreloadRes;
    }

    for (const file of STD_RAW) {
        run(file, {
            fileName: 'std',
            env: GLOBAL_CTX
        });
    }

    return GLOBAL_CTX;
}
