import type { ESFunction } from '../runtime/primitives/function';
import type { ESType } from '../runtime/primitives/type';
import type { ESNamespace } from "../runtime/primitives/namespace";
import type { ESObject } from "../runtime/primitives/object";
import type {NativeModuleBuilder} from './module';
import type { Map } from "../util/util";

import { IS_NODE_INSTANCE, libs } from '../util/constants';
import { Error } from '../errors';
import { ESJSBinding } from "../runtime/primitives/jsbinding";

// All modules
// make this only import required modules in the future
import ascii from './built-in-modules/ascii';
import json from './built-in-modules/json';
import dom from './built-in-modules/dom';
import time from './built-in-modules/time';
import regex from "./built-in-modules/regex";

export type ModulePrim = ESJSBinding | ESNamespace | ESFunction | ESType | ESObject;

// Built In Modules
const BIMs: Map<NativeModuleBuilder> = {
    ascii,
    json,
    time,
    regex,
    promise: () => Promise,
    math: () => Math,
};

// memoize the modules for faster access
const initialisedModules: Map<ModulePrim> = {};

export function initModules (): void | Error {
    if (!IS_NODE_INSTANCE) {
        // add the dom module if we are in a browser
        BIMs['dom'] = dom;
    }
}

/**
 * Boolean of whether a module of that name exits
 */
export function moduleExist (name: string): boolean {
    return name in BIMs || name in initialisedModules;
}

/**
 * Add a module
 */
export function addModule (name: string, body: ModulePrim): void {
    initialisedModules[name] = body;
}

/**
 * Get a module.
 * Returns an error if the module loader function returns an error
 */
export function getModule (name: string): ModulePrim | undefined | Error {

    if (name in initialisedModules) {
        return initialisedModules[name];
    }

    if (name in BIMs) {
        const res = BIMs[name](libs);
        if (res instanceof Error) return res;
        const processed = new ESJSBinding(res, name);
        initialisedModules[name] = processed;
        return processed
    }
}
