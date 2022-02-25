import { IS_NODE_INSTANCE, libs } from '../constants';
import {ESError} from '../errors';
import {wrap} from '../runtime/primitives/wrapStrip';
import {ESSymbol} from '../runtime/symbol';
import type {JSModule} from './module';
import { ESJSBinding } from "../runtime/primitives/esjsbinding";

// All modules
// make this only import required modules in the future
import ascii from './built-in-modules/ascii';
import json from './built-in-modules/json';
import dom from './built-in-modules/dom';


const modules: {[s: string]: JSModule} = {
    ascii, json
};

type modulePrimitive = ESJSBinding<{[k: string]: any}>;

// memoize the modules for faster access
const processedModules: {[s: string]: modulePrimitive} = {};

export function initModules () {

    processedModules['math'] = new ESJSBinding<{[p: string]: any}>(Math);

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
    return name in modules || name in processedModules;
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