import type {ESFunction} from '../runtime/primitives/function';
import type {ESType} from '../runtime/primitives/type';
import { IS_NODE_INSTANCE, libs } from '../util/constants';
import {Error} from '../errors';
import type {NativeModuleBuilder} from './module';
import { ESJSBinding } from "../runtime/primitives/jsbinding";
import type { Map } from "../util/util";

// All modules
// make this only import required modules in the future
import ascii from './built-in-modules/ascii';
import json from './built-in-modules/json';
import dom from './built-in-modules/dom';
import time from './built-in-modules/time';
import regex from "./built-in-modules/regex";

import { Namespace } from "../runtime/primitives/namespace";

export type modulePrimitive = ESJSBinding | Namespace | ESFunction | ESType;

const BIMs: Map<NativeModuleBuilder> = {
    ascii,
    json,
    time,
    regex,
    promise: () => Promise,
    math: () => Math,
};

// memoize the modules for faster access
const initialisedModules: Map<modulePrimitive> = {};

export function initModules (): void | Error {
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

export function getModule (name: string): modulePrimitive | undefined | Error {

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
