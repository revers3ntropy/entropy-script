import {ESNamespace, ESObject, ESPrimitive, ESString} from '../runtime/primitiveTypes.js';
import {ESSymbol} from "../runtime/context.js";

// All modules
// make this only import required modules in the future
import jsmaths from './built-in-modules/jsmaths.js';
import ascii from './built-in-modules/ascii.js';


const modules: {[s: string]: any} = {
    jsmaths, ascii
};

// memoize the modules for faster access
const processedModules: {[s: string]: ESNamespace} = {};

export function processRawModule (module: ESObject, name: string): ESNamespace {
    const moduleDict: {[s: string]: ESSymbol} = {};

    const moduleRaw = module.valueOf();

    for (const key in moduleRaw)
        moduleDict[key] = new ESSymbol(moduleRaw[key], key);

    return new ESNamespace(new ESString(name), moduleDict, false);
}

export function moduleExist (name: string) {
    return name in modules;
}

export function addModule (name: string, body: ESNamespace) {
    modules[name] = {};
    processedModules[name] = body;
}

export function addModuleFromObj (name: string, raw: {[s: string]: any}) {
    addModule(name, processRawModule(<ESObject>ESPrimitive.wrap(raw), name));
}

export function getModule (name: string): ESNamespace | undefined {
    if (name in processedModules)
        return processedModules[name];
    if (name in modules) {
        const res = ESPrimitive.wrap(modules[name]);
        if (!(res instanceof ESObject)) {
            console.log('Error: module ' + name + 'is not of type object'.red);
            return;
        }
        const processed = processRawModule(res, name);
        processedModules[name] = processed;
        return processed
    }
    return undefined;
}