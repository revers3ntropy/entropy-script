import {wrap} from '../runtime/primitives/wrapStrip.js';
import {ESNamespace, ESObject, ESString} from '../runtime/primitiveTypes.js';
import {ESSymbol} from '../runtime/symbol.js';
import type {JSModule} from './module.js';

// All modules
// make this only import required modules in the future
import maths from './built-in-modules/maths.js';
import ascii from './built-in-modules/ascii.js';
import json from './built-in-modules/json.js';
import dom from './built-in-modules/dom.js';

const modules: {[s: string]: JSModule} = {
    maths, ascii, json, dom
};

// memoize the modules for faster access
const processedModules: {[s: string]: ESNamespace} = {};

export function processRawModule (module: ESObject, name: string): ESNamespace {
    const moduleDict: {[s: string]: ESSymbol} = {};

    const moduleRaw = module.valueOf();

    for (const key of Object.keys(moduleRaw)) {
        moduleDict[key] = new ESSymbol(moduleRaw[key], key);
    }

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
    addModule(name, processRawModule(<ESObject>wrap(raw), name));
}

export function getModule (name: string): ESNamespace | undefined {
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
        return processed
    }
}