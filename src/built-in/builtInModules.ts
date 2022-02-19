import { IS_NODE_INSTANCE, libs } from '../constants.js';
import {ESError} from '../errors.js';
import {wrap} from '../runtime/primitives/wrapStrip.js';
import {ESSymbol} from '../runtime/symbol.js';
import type {JSModule} from './module.js';

// All modules
// make this only import required modules in the future
import maths from './built-in-modules/maths.js';
import ascii from './built-in-modules/ascii.js';
import json from './built-in-modules/json.js';
import dom from './built-in-modules/dom.js';
import { ESJSBinding } from "../runtime/primitives/esjsbinding.js";

const modules: {[s: string]: JSModule} = {
    maths, ascii, json
};

type modulePrimitive = ESJSBinding<{[k: string]: any}>;

// memoize the modules for faster access
const processedModules: {[s: string]: modulePrimitive} = {};

export function initModules () {

    if (!IS_NODE_INSTANCE) {
        const domRes = dom(libs);
        if (!(domRes instanceof ESError)) {
            modules['dom'] = domRes;
        } else {
            return domRes;
        }
    }
}

export function processRawModule (module: modulePrimitive, name: string): modulePrimitive {
    const moduleDict: {[s: string]: ESSymbol} = {};

    const moduleRaw = module.valueOf();

    for (const key of Object.keys(moduleRaw)) {
        moduleDict[key] = new ESSymbol(moduleRaw[key], key);
    }

    return new ESJSBinding(moduleDict, name);
}

export function moduleExist (name: string) {
    return name in modules;
}

export function addModule (name: string, body: modulePrimitive) {
    modules[name] = {};
    processedModules[name] = body;
}

export function addModuleFromObj (name: string, raw: {[s: string]: any}) {
    addModule(name, processRawModule(<modulePrimitive>wrap(raw), name));
}

export function getModule (name: string): modulePrimitive | undefined {
    if (name in processedModules) {
        return processedModules[name];
    }
    if (name in modules) {
        const res = new ESJSBinding(modules[name]);
        const processed = processRawModule(res, name);
        processedModules[name] = processed;
        return processed
    }
}