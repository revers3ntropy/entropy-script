import { builtInFunctions } from "./builtInFunctions.js";
import { Context } from "./context.js";
import { ESError, ImportError } from "./errors.js";
import { Position } from "./position.js";
import { run } from "./index.js";
import {globalConstants, IS_NODE_INSTANCE, setNone} from "./constants.js";
import { str } from "./util.js";
import {ESFunction, ESNamespace, ESString} from "./primitiveTypes.js";
import {interpretResult} from "./nodes";

export function initialise (globalContext: Context, printFunc: (...args: string[]) => void, inputFunc: (msg: string, cb: (...arg: any[]) => any) => void, libs: string[] = []) {
    builtInFunctions['import'] = (rawUrl, callback) => {
        if (IS_NODE_INSTANCE)
            return new ESError(Position.unknown, 'ImportError', 'Is running in node instance but trying to run browser import function');
        const url: ESString = rawUrl.str();

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

                    callback.__call__([
                        new ESNamespace(url, env.getSymbolTableAsDict())
                    ]);
                });
        } catch (E) {
            return new ESError(Position.unknown, 'ImportError', E.toString());
        }
    };

    builtInFunctions['print'] = async (...args) => {
        let out = ``;
        for (let arg of args)
            out += str(arg);
        printFunc(out);
    };

    builtInFunctions['input'] = async (msg, cbRaw) => {
        inputFunc(msg.valueOf(), (msg) => {
            let cb = cbRaw?.valueOf();
            if (cb instanceof ESFunction) {
                let res = cb.__call__([
                    new ESString(msg)
                ]);
                if (res instanceof ESError)
                    console.log(res.str);
            } else if (typeof cb === 'function')
                cb(msg);

            return new ESString('\'input()\' does not return anything. Pass in a function as the second argument, which will take the user input as an argument.');
        });
    };

    for (let builtIn in builtInFunctions) {
        globalContext.set(builtIn,
            new ESFunction(builtInFunctions[builtIn], [], builtIn),
            {
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

        if (constant === 'undefined')
            setNone(value.valueOf());
    }

    for (let lib of libs) {
        // @ts-ignore
        builtInFunctions['import'](lib);
    }

    globalContext.libs = libs;
    globalContext.initialisedAsGlobal = true;
}
