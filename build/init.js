var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { builtInFunctions } from "./built-in/builtInFunctions.js";
import { getModule, initModules, moduleExist } from './built-in/builtInModules.js';
import { Context } from "./runtime/context.js";
import { ESError, ImportError } from "./errors.js";
import { Position } from "./position.js";
import { run } from "./index.js";
import { IS_NODE_INSTANCE } from "./constants.js";
import { str } from "./util/util.js";
import { ESFunction, ESNamespace, ESString } from './runtime/primitiveTypes.js';
import loadGlobalConstants from "./built-in/globalConstants.js";
export function initialise(globalContext, printFunc, inputFunc) {
    builtInFunctions['import'] = [({ context }, rawUrl, callback) => {
            if (IS_NODE_INSTANCE) {
                return new ESError(Position.unknown, 'ImportError', 'Is running in node instance but trying to run browser import function');
            }
            const url = rawUrl.str();
            if (moduleExist(str(url))) {
                return getModule(str(url));
            }
            try {
                fetch(str(url))
                    .then(c => c.text())
                    .then((code) => __awaiter(this, void 0, void 0, function* () {
                    const env = new Context();
                    env.parent = globalContext;
                    const res = yield run(code);
                    if (res.error) {
                        printFunc(new ImportError(Position.unknown, str(url), res.error.str).str);
                        return;
                    }
                    if (!(callback instanceof ESFunction))
                        return;
                    callback.__call__({ context }, new ESNamespace(url, env.getSymbolTableAsDict()));
                }));
            }
            catch (E) {
                return new ESError(Position.unknown, 'ImportError', E.toString());
            }
        }, {}];
    builtInFunctions['print'] = [({ context }, ...args) => {
            let out = ``;
            for (let arg of args)
                out += str(arg);
            printFunc(out);
        }, {}];
    builtInFunctions['input'] = [({ context }, msg, cbRaw) => {
            inputFunc(msg.valueOf(), (msg) => {
                let cb = cbRaw === null || cbRaw === void 0 ? void 0 : cbRaw.valueOf();
                if (cb instanceof ESFunction) {
                    let res = cb.__call__({ context }, new ESString(msg));
                    if (res instanceof ESError) {
                        console.log(res.str);
                    }
                }
                else if (typeof cb === 'function')
                    cb(msg);
                return new ESString('\'input()\' does not return anything. Pass in a function as the second argument, which will take the user input as an argument.');
            });
        }, {}];
    for (let builtIn in builtInFunctions) {
        const fn = new ESFunction(builtInFunctions[builtIn][0], [], builtIn, undefined, undefined, globalContext);
        fn.info = builtInFunctions[builtIn][1];
        fn.info.name = builtIn;
        fn.info.isBuiltIn = true;
        fn.info.file = 'built-in';
        globalContext.set(builtIn, fn, {
            global: true,
            isConstant: true
        });
    }
    loadGlobalConstants(globalContext);
    const initModRes = initModules();
    if (initModRes) {
        return initModRes;
    }
    globalContext.initialisedAsGlobal = true;
}
