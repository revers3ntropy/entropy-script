import { ESNamespace, ESString } from "../runtime/primitiveTypes.js";
import { ESSymbol } from "../runtime/context.js";
// All modules
// make this only import required modules in the future
import jsmaths from './built-in-modules/jsmaths.js';
const modules = {
    jsmaths,
};
// memoize the modules for faster access
const processedModules = {};
function processRawModule(module, name) {
    const moduleDict = {};
    const moduleRaw = module.valueOf();
    for (const key in moduleRaw)
        moduleDict[key] = new ESSymbol(moduleRaw[key], key);
    return new ESNamespace(new ESString(name), moduleDict, false);
}
export function moduleExist(name) {
    return name in modules;
}
export function getModule(name) {
    if (name in processedModules)
        return processedModules[name];
    if (name in modules) {
        const processed = processRawModule(modules[name], name);
        processedModules[name] = processed;
        return processed;
    }
    return undefined;
}
