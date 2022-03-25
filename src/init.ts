import { addDependencyInjectedBIFs, builtInFunctions } from "./built-in/builtInFunctions";
import { addModule, initModules } from './built-in/builtInModules';
import {preloadModules} from './built-in/module';
import addNodeBIFs from './built-in/nodeLibs';
import {config} from './config';
import { Context } from "./runtime/context";
import { ESError } from "./errors";
import {ESFunction, ESJSBinding, initPrimitiveTypes} from './runtime/primitiveTypes';
import loadGlobalConstants from "./built-in/globalConstants";
import {global, refreshPerformanceNow, runningInNode, setGlobalContext, types} from './util/constants';
import { dict } from "./util/util";
import { NativeObj } from "./runtime/primitives/primitive";
import {libs as globalLibs} from "./util/constants";

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
} = {}): Promise<ESError | Context> {

    setGlobalContext(context);

    initPrimitiveTypes();

    for (let k of Object.keys(libs)) {
        if (!Array.isArray(libs[k]) || libs[k].length !== 2) {
            throw `lib ${k} is not of type [any, boolean]`;
        }
        let [lib, exposed] = libs[k];
        if (exposed === true) {
            addModule(k, new ESJSBinding(lib));
        }
        globalLibs[k] = lib;
    }

    addDependencyInjectedBIFs(print, input);

    for (let builtIn in builtInFunctions) {
        const fn = new ESFunction(
            builtInFunctions[builtIn][0],
            [],
            builtIn,
            undefined,
            undefined,
            context,
            true
        );

        fn.__info__ = builtInFunctions[builtIn][1];
        fn.__info__.name = builtIn;
        fn.__info__.isBuiltIn = true;
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
    if (modulePreloadRes instanceof ESError) {
        return modulePreloadRes;
    }

    return global;
}
