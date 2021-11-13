var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { builtInFunctions } from "./builtInFunctions.js";
import { ESError, ImportError, TypeError } from "./errors.js";
import { Position } from "./position.js";
import { run } from "./index.js";
import { globalConstants, setNone } from "./constants.js";
import { str } from "./util.js";
import { ESFunction, ESString } from "./primitiveTypes.js";
export function initialise(globalContext, printFunc, inputFunc, libs = []) {
    builtInFunctions['import'] = (rawUrl) => {
        if (!(rawUrl instanceof ESString))
            return new TypeError(Position.unknown, 'Number', rawUrl.typeOf().valueOf(), rawUrl.valueOf());
        const url = rawUrl.valueOf();
        function error(detail = 'Import Failed') {
            return new ImportError(Position.unknown, url, detail + '. Remember that relative URLs are only allowed with node.js');
        }
        if (!url)
            return error('No URL given');
        let pat = /^https?:\/\//i;
        if (pat.test(url)) {
            fetch(url)
                .then((result) => __awaiter(this, void 0, void 0, function* () {
                const res = yield run(yield result.text(), {
                    env: globalContext,
                });
                if (res.error)
                    console.log(res.error.str);
            }));
            return;
        }
        // node
        try {
            // @ts-ignore
            import('fs').then((fs) => __awaiter(this, void 0, void 0, function* () {
                // data is actually a string
                try {
                    const data = fs.readFileSync(url, { encoding: 'utf8' });
                    const res = yield run(data, {
                        env: globalContext,
                    });
                    if (res.error)
                        console.log(res.error.str);
                }
                catch (e) {
                    console.log(e);
                    console.log((new ImportError(Position.unknown, url, `
                        Could not import file ${url}: ${e.toString()}`)).str);
                }
            }));
        }
        catch (e) {
            return new ImportError(Position.unknown, `
                Could not import file ${url}: ${e}
            `);
        }
    };
    builtInFunctions['print'] = (...args) => __awaiter(this, void 0, void 0, function* () {
        let out = `> `;
        for (let arg of args)
            out += str(arg);
        printFunc(out);
    });
    builtInFunctions['input'] = (msg, cbRaw) => __awaiter(this, void 0, void 0, function* () {
        inputFunc(msg.valueOf(), (msg) => {
            let cb = cbRaw === null || cbRaw === void 0 ? void 0 : cbRaw.valueOf();
            if (cb instanceof ESFunction) {
                let res = cb.__call__([
                    new ESString(msg)
                ]);
                if (res instanceof ESError)
                    console.log(res.str);
            }
            else if (typeof cb === 'function')
                cb(msg);
            return new ESString('\'input()\' does not return anything. Pass in a function as the second argument, which will take the user input as an argument.');
        });
    });
    for (let builtIn in builtInFunctions) {
        globalContext.set(builtIn, new ESFunction(builtInFunctions[builtIn], [], builtIn), {
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
