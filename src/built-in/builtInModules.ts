import { global, IS_NODE_INSTANCE, libs } from '../constants';
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

import Position from "../position";
import { Context } from "../runtime/context";
import { ESNamespace } from "../runtime/primitives/esnamespace";
import { ESString } from "../runtime/primitives/esstring";
import { interpretResult } from "../runtime/nodes";
import { run } from "../index";

type modulePrimitive = ESJSBinding<any> | ESNamespace;

const BIMs: dict<NativeModuleBuilder> = {
    ascii,
    json,
    time,
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

export async function preloadModules (urls: dict<string>): Promise<ESError | undefined> {

    for (const name of Object.keys(urls)) {

        let url = urls[name];

        if (url.substring(url.length-3) !== '.es') {
            url = url + '.es';
        }

        try {
            let data = await (await fetch(url)).text();

            const env = new Context();
            env.parent = global;

            let splitUrl = url.split("/");
            let scriptName = splitUrl.pop();
            let exDir = splitUrl.join("/");

            const n = new ESNamespace(new ESString(scriptName), {});

            const res: interpretResult = run(data, {
                env,
                fileName: name,
                currentDir: exDir,
            });

            n.__value__ = env.getSymbolTableAsDict();

            if (res.error) {
                return res.error;
            }

            initialisedModules[name] = n;

        } catch (E: any) {
            return new ESError(Position.void, 'ImportError', E.toString());
        }
    }
}