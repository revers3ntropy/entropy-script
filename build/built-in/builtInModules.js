import { wrap } from '../runtime/primitives/wrapStrip.js';
import { ESNamespace, ESObject, ESString } from '../runtime/primitiveTypes.js';
import { ESSymbol } from '../runtime/symbol.js';
// All modules
// make this only import required modules in the future
import maths from './built-in-modules/maths.js';
import ascii from './built-in-modules/ascii.js';
import json from './built-in-modules/json.js';
const modules = {
    maths, ascii, json
};
// memoize the modules for faster access
const processedModules = {};
export function processRawModule(module, name) {
    const moduleDict = {};
    const moduleRaw = module.valueOf();
    for (const key in moduleRaw)
        moduleDict[key] = new ESSymbol(moduleRaw[key], key);
    return new ESNamespace(new ESString(name), moduleDict, false);
}
export function moduleExist(name) {
    return name in modules;
}
export function addModule(name, body) {
    modules[name] = {};
    processedModules[name] = body;
}
export function addModuleFromObj(name, raw) {
    addModule(name, processRawModule(wrap(raw), name));
}
export function getModule(name) {
    if (name in processedModules) {
        return processedModules[name];
    }
    if (name in modules) {
        const res = wrap(modules[name]);
        if (!(res instanceof ESObject)) {
            console.log('Error: module ' + name + 'is not of type object'.red);
            return;
        }
        const processed = processRawModule(res, name);
        processedModules[name] = processed;
        return processed;
    }
}
