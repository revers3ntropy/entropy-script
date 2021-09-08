import {builtInArgs, builtInFunctions} from "./builtInFunctions.js";
import {N_builtInFunction, N_function, N_functionCall, N_string} from "./nodes.js";
import {Context} from "./context.js";
import {ImportError, TypeError} from "./errors.js";
import {Position} from "./position.js";
import {run} from "./index.js";
import {global, globalConstants} from "./constants.js";
import {str} from "./util.js";
import {Token, tt} from "./tokens.js";

export function initialise (globalContext: Context, printFunc: (...args: any[]) => void, inputFunc: (msg: string, cb: (...arg: any[]) => any) => void, libs: string[]) {
    builtInFunctions['import'] = context => {
        let url = '';
        if (context instanceof Context)
            url = context.get('url');
        else if (typeof context === 'string')
            url = context;
        else
            return new TypeError(Position.unknown, Position.unknown, 'string | Context', typeof context);

        function error (detail = 'Import Failed') {
            return new ImportError(Position.unknown, Position.unknown, url, detail + '. Remember that relative URLs are only allowed with node.js');
        }

        if (!url) return error('No URL given');


        let pat = /^https?:\/\//i;
        if (pat.test(url)) {

            fetch(url)
                .then(async (result: any) => {

                const res = await run(await result.text(), {
                    env: globalContext,
                });
                if (res.error)
                    console.log(res.error.str);
            });
            return;
        }

        // node
        try {
            import('fs').then(async (fs: any) => {
                // data is actually a string
                try {
                    const data: any = fs.readFileSync(url, {encoding:'utf8'});
                    const res = await run(data, {
                        env: globalContext,
                    });

                    if (res.error)
                        console.log(res.error.str);
                }
                catch(e){
                    console.log((new ImportError(Position.unknown, Position.unknown, `
                        Could not import file ${url}
                    `)).str);
                }
            });

        } catch (e) {
            return new ImportError(Position.unknown, Position.unknown, `
            Could not import file ${url}
        `)
        }
    }

    builtInFunctions['print'] = async context => {
        let output = '> ';
        if (context instanceof Context) {
            for (let arg of context.get('args'))
                output += str(arg);
        } else {
            output += str(context);
        }

        printFunc(output);
    }

    builtInFunctions['input'] = async context => {
        inputFunc(context.get('msg'), (msg) => {
            let cb = context.get('cb');
            if (cb instanceof N_function) {
                let caller = new N_functionCall(Position.unknown, Position.unknown, cb, [
                    new N_string(Position.unknown, Position.unknown, new Token(Position.unknown, Position.unknown, tt.STRING, msg))
                ]);
                let res = caller.interpret(context);
                if (res.error)
                    console.log(res.error.str);
            } else if (typeof cb === 'function')
                cb(msg);

            return '\'input()\' does not return anything. Pass in a function as the second argument, which will take the user input as an argument.'
        });
    }

    for (let builtIn in builtInFunctions) {
        const node = new N_builtInFunction(builtInFunctions[builtIn], builtInArgs[builtIn] || []);
        globalContext.set(builtIn, node, {
            global: true,
            isConstant: true
        });
    }

    for (let constant in globalConstants) {
        globalContext.set(constant, globalConstants[constant], {
            global: true,
            isConstant: true
        });
    }

    for (let lib of libs) {
        // @ts-ignore
        builtInFunctions['import'](lib);
    }

    globalContext.libs = libs;
    globalContext.initialisedAsGlobal = true;
}
