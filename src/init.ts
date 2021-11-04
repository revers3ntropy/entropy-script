import { builtInFunctions } from "./builtInFunctions.js";
import { Context } from "./context.js";
import { ESError, ImportError, TypeError } from "./errors.js";
import { Position } from "./position.js";
import { run } from "./index.js";
import { global, globalConstants, setNone } from "./constants.js";
import { str } from "./util.js";
import { ESFunction, ESString, Primitive } from "./primitiveTypes.js";

export function initialise (globalContext: Context, printFunc: (...args: any[]) => void, inputFunc: (msg: string, cb: (...arg: any[]) => any) => void, libs: string[]) {
    builtInFunctions['import'] = (rawUrl: Primitive) => {
        if (!(rawUrl instanceof ESString))
            return new TypeError(Position.unknown, 'Number', rawUrl.typeOf().valueOf(), rawUrl.valueOf());
        const url = rawUrl.valueOf();

        function error (detail = 'Import Failed') {
            return new ImportError(Position.unknown, url, detail + '. Remember that relative URLs are only allowed with node.js');
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
            // @ts-ignore
            import('fs').then(async (fs: any) => {
                // data is actually a string
                try {
                    const data: any = fs.readFileSync(url, {encoding:'utf8'});
                    const res = await run(data, {
                        env: globalContext,
                    });

                    if (res.error)
                        console.log(res.error.str);
                } catch(e) {
                    console.error(e);
                    console.log((new ImportError(Position.unknown, url, `
                        Could not import file ${url}: ${e.toString()}`)).str);
                }
            });

        } catch (e) {
            return new ImportError(Position.unknown, `
                Could not import file ${url}: ${e}
            `);
        }
    };

    builtInFunctions['print'] = async (...args) => {
        let out = `> `;
        for (let arg of args)
            out += str(arg);
        printFunc(out);
    };

    builtInFunctions['input'] = async (msg: Primitive, cbRaw: Primitive) => {
        inputFunc(msg.valueOf(), (msg) => {
            let cb = cbRaw?.valueOf();
            if (cb instanceof ESFunction) {
                let res = cb.__call__([
                    new ESString(msg)
                ], global);
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
