import { Position } from "../position.js";
import { Context } from "../runtime/context.js";
import { ESError, ImportError } from "../errors.js";
import { ESFunction, ESNamespace, ESObject, ESString, types } from '../runtime/primitiveTypes.js';
import { str } from "../util/util.js";
import { run } from "../index.js";
import { addModuleFromObj, getModule, moduleExist } from './builtInModules.js';
import { global, importCache } from "../constants.js";
import { ESJSBinding } from "../runtime/primitives/esjsbinding.js";
function addNodeLibs(options, context) {
    const { fs, path } = options;
    addModuleFromObj('fs', new ESJSBinding(fs, 'fs'));
    addModuleFromObj('path', new ESJSBinding(path, 'path'));
    addModuleFromObj('http', new ESJSBinding(options.http, 'http'));
    addModuleFromObj('https', new ESJSBinding(options.https, 'https'));
    addModuleFromObj('mysql', new ESJSBinding(options.mysql, 'mysql'));
    context.set('import', new ESFunction(({ context }, rawPath) => {
        let scriptPath = str(rawPath);
        if (moduleExist(scriptPath)) {
            return getModule(scriptPath);
        }
        scriptPath = path.join(context.path, scriptPath);
        if (scriptPath in importCache) {
            return importCache[scriptPath];
        }
        try {
            if (!fs.existsSync(scriptPath)) {
                if (fs.existsSync('./particles/' + scriptPath)) {
                    if (fs.existsSync('particles/' + scriptPath + '/main.es')) {
                        scriptPath = 'particles/' + scriptPath + '/main.es';
                    }
                    else {
                        return new ESError(Position.unknown, 'ImportError', `Module '${scriptPath}' has no entry point. Requires 'main.es'.`);
                    }
                }
                else {
                    return new ESError(Position.unknown, 'ImportError', `Can't find file '${scriptPath}' to import.`);
                }
            }
            const exDir = path.dirname(scriptPath);
            const code = fs.readFileSync(scriptPath, 'utf-8');
            const env = new Context();
            env.parent = global;
            env.path = exDir;
            const n = new ESNamespace(new ESString(scriptPath), {});
            importCache[scriptPath] = n;
            const res = run(code, {
                env,
                measurePerformance: false,
                fileName: scriptPath,
                currentDir: exDir,
            });
            n.__value__ = env.getSymbolTableAsDict();
            if (res.error) {
                return res.error;
            }
            return n;
        }
        catch (E) {
            return new ESError(Position.unknown, 'ImportError', E.toString());
        }
    }, [{ name: 'path', type: types.string }], 'import', undefined, types.object), {
        forceThroughConst: true,
        isConstant: true
    });
    context.setOwn('open', new ESFunction(({ context }, path_, encoding_) => {
        const path = str(path_);
        const encoding = str(encoding_) || 'utf-8';
        if (!fs.existsSync(path)) {
            return new ImportError(Position.unknown, path);
        }
        return new ESObject({
            str: new ESFunction(({ context }) => {
                return new ESString(fs.readFileSync(context.path + path, encoding));
            }, [], 'str', undefined, types.string),
            write: new ESFunction(({ context }, data) => {
                fs.writeFileSync(context.path + path, str(data));
            }, [{ name: 'path', type: types.string }]),
            append: new ESFunction(({ context }, data) => {
                fs.appendFileSync(context.path + path, str(data));
            }, [{ name: 'path', type: types.string }]),
        });
    }));
}
export default addNodeLibs;
