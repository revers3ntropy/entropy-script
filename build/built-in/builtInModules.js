import { IS_NODE_INSTANCE, libs } from '../constants.js';
import { ESError } from '../errors.js';
import { wrap } from '../runtime/primitives/wrapStrip.js';
import { ESSymbol } from '../runtime/symbol.js';
import { ESJSBinding } from "../runtime/primitives/esjsbinding.js";
import ascii from './built-in-modules/ascii.js';
import json from './built-in-modules/json.js';
import dom from './built-in-modules/dom.js';
const modules = {
    ascii, json
};
const processedModules = {};
export function initModules() {
    processedModules['math'] = new ESJSBinding(Math);
    if (!IS_NODE_INSTANCE) {
        const domRes = dom(libs);
        if (!(domRes instanceof ESError)) {
            modules['dom'] = domRes;
        }
        else {
            return domRes;
        }
    }
}
export function processRawModule(module, name) {
    const moduleDict = {};
    const moduleRaw = module.valueOf();
    for (const key of Object.keys(moduleRaw)) {
        moduleDict[key] = new ESSymbol(moduleRaw[key], key);
    }
    return new ESJSBinding(moduleDict, name);
}
export function moduleExist(name) {
    return name in modules || name in processedModules;
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
        const res = new ESJSBinding(modules[name]);
        const processed = processRawModule(res, name);
        processedModules[name] = processed;
        return processed;
    }
}
