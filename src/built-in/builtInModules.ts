import { global, IS_NODE_INSTANCE, libs } from '../constants';
import {ESError} from '../errors';
import {ESSymbol} from '../runtime/symbol';
import type {JSModule} from './module';
import { ESJSBinding } from "../runtime/primitives/esjsbinding";
import type { dict } from "../util/util";
import type { NativeObj } from "../runtime/primitives/primitive";

// All modules
// make this only import required modules in the future
import ascii from './built-in-modules/ascii';
import json from './built-in-modules/json';
import dom from './built-in-modules/dom';
import time from './built-in-modules/time';
import { Position } from "../position";
import { Context } from "../runtime/context";
import { ESNamespace } from "../runtime/primitives/esnamespace";
import { ESString } from "../runtime/primitives/esstring";
import { interpretResult } from "../runtime/nodes";
import { run } from "../index";


const modules: {[s: string]: JSModule} = {};

type modulePrimitive = ESJSBinding<dict<any>> | ESNamespace;

// memoize the modules for faster access
const processedModules: {[s: string]: modulePrimitive} = {};

export function initModules (): void | ESError {

    processedModules['math'] = new ESJSBinding<NativeObj>(Math);
    processedModules['promise'] = new ESJSBinding<NativeObj>(Promise);
    processedModules['time'] = new ESJSBinding<NativeObj>(time(libs));
    processedModules['json'] = new ESJSBinding<NativeObj>(json);
    processedModules['ascii'] = new ESJSBinding<NativeObj>(ascii);

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

export function moduleExist (name: string): boolean {
    return name in modules || name in processedModules;
}

export function addModule (name: string, body: modulePrimitive): void {
    modules[name] = {};
    processedModules[name] = body;
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

            processedModules[name] = n;

        } catch (E: any) {
            return new ESError(Position.void, 'ImportError', E.toString());
        }
    }
}