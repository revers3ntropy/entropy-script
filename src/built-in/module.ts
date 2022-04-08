import {GLOBAL_CTX} from '../util/constants';
import {ESBoolean, ESJSBinding, run} from '../index';
import {Context} from '../runtime/context';
import {InterpretResult} from '../runtime/nodes';
import {ESNamespace} from '../runtime/primitives/esnamespace';
import {ESString} from '../runtime/primitives/esstring';
import type { Map } from "../util/util";
import { Error } from "../errors";
import {addModule, modulePrimitive} from './builtInModules';

export type NativeModule = Map<any>;
export type NativeModuleBuilder = (dependencies: Map<any>) => NativeModule | Error;

const loadedURls: Map<modulePrimitive> = {};

export async function preloadModules (urls: Map<any>): Promise<Error | undefined> {

    for (const name of Object.keys(urls)) {

        let url = urls[name];

        if (typeof url !== 'string') {
            addModule(name, new ESJSBinding(url));
        }

        if (url in loadedURls) {
            addModule(name, loadedURls[url]);
        }

        if (url.substring(url.length-3) !== '.es') {
            url = url + '.es';
        }

        try {
            const data = await (await fetch(url)).text();

            const env = new Context();
            env.parent = GLOBAL_CTX;
            env.set('__main__', new ESBoolean(), {
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