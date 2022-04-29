import { GLOBAL_CTX, SCRIPT_EXT } from '../util/constants';
import {ESBoolean, ESJSBinding, run} from '../index';
import {Context} from '../runtime/context';
import {InterpretResult} from '../runtime/nodes';
import {ESNamespace} from '../runtime/primitives/namespace';
import {ESString} from '../runtime/primitives/string';
import type { Map } from "../util/util";
import { Error } from "../errors";
import {addModule, ModulePrim} from './builtInModules';

export type NativeModule = Map;
export type NativeModuleBuilder = (dependencies: Map) => NativeModule | Error;

const loadedURls: Map<ModulePrim> = {};

/**
 * Pre-loads a module from a map of URLs
 */
export async function preloadModules (urls: Map): Promise<Error | undefined> {

    for (const name of Object.keys(urls)) {

        let url = urls[name];

        if (typeof url !== 'string') {
            addModule(name, new ESJSBinding(url));
        }

        if (url in loadedURls) {
            addModule(name, loadedURls[url]);
        }

        if (url.substring(url.length-3) !== '.' + SCRIPT_EXT) {
            url = url + '.' + SCRIPT_EXT;
        }

        try {
            const data = await (await fetch(url)).text();

            const env = new Context();
            env.parent = GLOBAL_CTX;
            env.set('__main__', new ESBoolean(false), {
                isConstant: true,
                forceThroughConst: true,
                global: true
            });

            const splitUrl = url.split("/");
            const scriptName = splitUrl.pop();
            const exDir = splitUrl.join("/");

            const n = new ESNamespace(new ESString(scriptName), {});

            // before running the code to prevent circular imports going unchecked
            loadedURls[url] = n;

            const res: InterpretResult = run(data, {
                env,
                fileName: name,
                currentDir: exDir,
            });

            n.__value__ = env.getSymbolTableAsDict();

            if (res.error) {
                return res.error;
            }

            addModule(name, n);

        } catch (E: any) {
            return new Error('ImportError', E.toString());
        }
    }
}