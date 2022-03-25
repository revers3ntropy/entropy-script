import { global, IS_NODE_INSTANCE, libs } from '../util/constants';
import {ESError} from '../errors';
import type {NativeModuleBuilder} from './module';
import { ESJSBinding } from "../runtime/primitives/esjsbinding";
import type { dict } from "../util/util";

// All modules
// make this only import required modules in the future
import ascii from './built-in-modules/ascii';
import json from './built-in-modules/json';
import dom from './built-in-modules/dom';
import time from './built-in-modules/time';
import regex from "./built-in-modules/regex";

import { ESNamespace } from "../runtime/primitives/esnamespace";

export type modulePrimitive = ESJSBinding<any> | ESNamespace;

const BIMs: dict<NativeModuleBuilder> = {
    ascii,
    json,
    time,
    regex
};

// memoize the modules for faster access
const initialisedModules: dict<modulePrimitive> = {};

export function initModules (): void | ESError {
    if (!IS_NODE_INSTANCE) {
        BIMs['dom'] = dom;
    }
}

export function moduleExist (name: string): boolean {
    return name in BIMs || name in initialisedModules;
}

export function addModule (name: string, body: modulePrimitive): void {
    initialisedModules[name] = body;
}

export function getModule (name: string): modulePrimitive | undefined | ESError {

    if (name in initialisedModules) {
        return initialisedModules[name];
    }

    if (name in BIMs) {
        const res = BIMs[name](libs);
        if (res instanceof ESError) return res;
        const processed = new ESJSBinding(res, name);
        initialisedModules[name] = processed;
        return processed
    }
}
