import { builtInFunctions } from "./built-in/builtInFunctions.js";
import {getModule, moduleExist} from './built-in/builtInModules.js';
import { Context } from "./runtime/context.js";
import { ESError, ImportError } from "./errors.js";
import { Position } from "./position.js";
import { run } from "./index.js";
import {IS_NODE_INSTANCE} from "./constants.js";
import { str } from "./util/util.js";
import {ESFunction, ESNamespace, ESString, ESType, types} from './runtime/primitiveTypes.js';
import {interpretResult} from "./runtime/nodes.js";
import {globalConstants} from "./built-in/globalConstants.js";

export function initialise (
    globalContext: Context,
    printFunc: (...args: string[]) => void,
    inputFunc: (msg: string, cb: (...arg: any[]) => any) => void
) {

    builtInFunctions['import'] = [({context}, rawUrl, callback) => {
        if (IS_NODE_INSTANCE)
            return new ESError(Position.unknown, 'ImportError', 'Is running in node instance but trying to run browser import function');
        const url: ESString = rawUrl.str();

        if (moduleExist(str(url)))
            return getModule(str(url));

        try {
            fetch (str(url))
                .then(c => c.text())
                .then (async code => {
                    const env = new Context();
                    env.parent = globalContext;
                    const res: interpretResult = await run(code);

                    if (res.error) {
                        printFunc(new ImportError(Position.unknown, str(url), res.error.str).str);
                        return;
                    }

                    if (!(callback instanceof ESFunction)) return;

                    callback.__call__({context},
                        new ESNamespace(url, env.getSymbolTableAsDict())
                    );
                });
        } catch (E) {
            return new ESError(Position.unknown, 'ImportError', E.toString());
        }
    }, {}];

    builtInFunctions['print'] = [({context}, ...args) => {
        let out = ``;
        for (let arg of args)
            out += str(arg);
        printFunc(out);
    }, {}];

    builtInFunctions['input'] = [({context}, msg, cbRaw) => {
        inputFunc(msg.valueOf(), (msg) => {
            let cb = cbRaw?.valueOf();
            if (cb instanceof ESFunction) {
                let res = cb.__call__({context},
                    new ESString(msg)
                );
                if (res instanceof ESError)
                    console.log(res.str);
            } else if (typeof cb === 'function')
                cb(msg);

            return new ESString('\'input()\' does not return anything. Pass in a function as the second argument, which will take the user input as an argument.');
        })
    }, {}];

    for (let builtIn in builtInFunctions) {
        const fn = new ESFunction(builtInFunctions[builtIn][0], [], builtIn);

        fn.info = builtInFunctions[builtIn][1];
        fn.info.name = builtIn;
        fn.info.isBuiltIn = true;
        fn.info.file = 'built-in';

        globalContext.set(builtIn, fn, {
            global: true,
            isConstant: true
        });
    }

    for (let constant in globalConstants) {
        const value = globalConstants[constant];
        globalContext.set(constant, value, {
            global: true,
            isConstant: true
        });
    }

    globalContext.initialisedAsGlobal = true;
}
