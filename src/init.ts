import { addDependencyInjectedBIFs, builtInFunctions } from "./built-in/builtInFunctions";
import { addModule, initModules } from './built-in/builtInModules';
import {preloadModules} from './built-in/module';
import addNodeBIFs from './built-in/nodeLibs';
import {config} from './config';
import { Context } from "./runtime/context";
import { Error } from "./errors";
import { ESFunction, ESJSBinding, ESUndefined, initPrimitiveTypes } from './runtime/primitiveTypes';
import loadGlobalConstants from "./built-in/globalConstants";
import {global, refreshPerformanceNow, runningInNode, setGlobalContext, types} from './util/constants';
import { dict } from "./util/util";
import { NativeObj } from "./runtime/primitives/primitive";
import {libs as globalLibs} from "./util/constants";
import { runtimeArgument } from "./runtime/argument";

export default async function init ({
  print = console.log,
  input = () => {},
  node = true,
  context = new Context(),
  path = '',
  libs = {}
}: {
    print?: (...args: any[]) => void,
    input?: (msg: string, cb: (...arg: any[]) => any) => void,
    node?: boolean,
    context?: Context,
    path?: string,
    libs?: dict<[NativeObj, boolean]>
} = {}): Promise<Error | Context> {

    setGlobalContext(context);

    initPrimitiveTypes();

    for (let k of Object.keys(libs)) {
        if (!Array.isArray(libs[k]) || libs[k].length !== 2) {
            throw `lib ${k} is not of type [any, boolean]`;
        }
        let [lib, exposed] = libs[k];
        if (typeof exposed !== 'boolean') {
            throw `lib ${k} is not of type [any, boolean]`;
        }
        if (exposed) {
            addModule(k, new ESJSBinding(lib));
        }
        globalLibs[k] = lib;
    }

    addDependencyInjectedBIFs(print, input);

    for (let builtIn in builtInFunctions) {
        let [rawFn, info] = builtInFunctions[builtIn];

        let numArgs = info.args?.length ?? rawFn.length-1;
        let args: runtimeArgument[] = (new Array(numArgs))
            .fill({
                name: 'unknown',
                type: types.any,
                defaultValue: new ESUndefined()
            } as runtimeArgument);

        const fn = new ESFunction(
            rawFn,
            args,
            builtIn,
            undefined,
            undefined,
            context,
            true
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

    if (node) {
        runningInNode();
        await refreshPerformanceNow(true);
        addNodeBIFs(context);
    }

    let modulePreloadRes = await preloadModules(config.modules);
    if (modulePreloadRes instanceof Error) {
        return modulePreloadRes;
    }

    return global;
}
