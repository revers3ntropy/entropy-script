import { Position } from "../position.js";
import { Context } from "../runtime/context.js";
import { ESError, ImportError } from "../errors.js";
import { ESFunction, ESNamespace, ESObject, ESString, types } from '../runtime/primitiveTypes.js';
import { str } from "../util/util.js";
import { run } from "../index.js";
import { addModuleFromObj, getModule, moduleExist } from './builtInModules.js';
// node only built in modules
import http from './built-in-modules/http.js';
import MySQL from './built-in-modules/mysql.js';
/**
 * Adds node functionality like access to files, https and more.
 * @param {JSModuleParams} options
 */
function addNodeLibs(options) {
    addModuleFromObj('http', http(options));
    addModuleFromObj('mysql', MySQL(options));
    const { context, fs } = options;
    context.set('import', new ESFunction(({ context }, rawPath) => {
        let path = str(rawPath);
        if (moduleExist(path))
            return getModule(path);
        try {
            if (!fs.existsSync(path)) {
                if (fs.existsSync('./particles/' + path)) {
                    if (fs.existsSync('particles/' + path + '/main.es'))
                        path = 'particles/' + path + '/main.es';
                    else
                        return new ESError(Position.unknown, 'ImportError', `Module '${path}' has no entry point. Requires 'main.es'.`);
                }
                else
                    return new ESError(Position.unknown, 'ImportError', `Can't find file '${path}' to import.`);
            }
            const code = fs.readFileSync(path, 'utf-8');
            const env = new Context();
            env.parent = context;
            const res = run(code, {
                env,
                fileName: path
            });
            if (res.error)
                return new ImportError(Position.unknown, str(path), res.error.str);
            return new ESNamespace(new ESString(path), env.getSymbolTableAsDict());
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
        if (!fs.existsSync(path))
            return new ImportError(Position.unknown, path);
        return new ESObject({
            str: new ESFunction(({ context }) => {
                return new ESString(fs.readFileSync(path, encoding));
            }, [], 'str', undefined, types.string),
            write: new ESFunction(({ context }, data) => {
                fs.writeFileSync(path, str(data));
            }),
            append: new ESFunction(({ context }, data) => {
                fs.appendFileSync(path, str(data));
            }),
        });
    }));
}
export default addNodeLibs;
