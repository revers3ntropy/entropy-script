import {Position} from "../position";
import {Context} from "../runtime/context";
import {ESError, ImportError, PermissionRequiredError} from '../errors';
import {ESFunction, ESNamespace, ESObject, ESString, Primitive, types} from '../runtime/primitiveTypes';
import { str } from "../util/util";
import {interpretResult} from "../runtime/nodes";
import {permissions, run} from '../index';
import {JSModuleParams} from './module';
import {addModuleFromObj, getModule, moduleExist} from './builtInModules';
import { global, importCache } from "../constants";

// node only built in modules
import { ESJSBinding } from "../runtime/primitives/esjsbinding";

/**
 * Adds node functionality like access to files, https and more.
 * @param {JSModuleParams} options
 * @param {Context} context
 */
function addNodeLibs (options: JSModuleParams, context: Context) {

    const { fs, path } = options;

    for (let libName in options) {
        if (options.hasOwnProperty(libName)) {
            addModuleFromObj(libName, new ESJSBinding(options[libName], libName));
        }
    }

    context.set('import', new ESFunction(({context}, rawPath): ESError | Primitive | undefined => {

        if (!permissions.imports) {
            return new PermissionRequiredError('Imports not allowed');
        }

        if (!permissions.imports) {
            return new PermissionRequiredError('Imports not allowed');
        }

        let scriptPath: string = str(rawPath);

        if (permissions.useSTD && moduleExist(scriptPath)) {
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
                    } else {
                        return new ESError(Position.unknown, 'ImportError', `Module '${scriptPath}' has no entry point. Requires 'main.es'.`)
                    }
                } else {
                    return new ESError(Position.unknown, 'ImportError', `Can't find file '${scriptPath}' to import.`)
                }
            }

            const exDir = path.dirname(scriptPath);

            const code = fs.readFileSync(scriptPath, 'utf-8');
            const env = new Context();
            env.parent = global;
            env.path = exDir;

            const n = new ESNamespace(new ESString(scriptPath), {});
            importCache[scriptPath] = n;

            const res: interpretResult = run(code, {
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

        } catch (E: any) {
            return new ESError(Position.unknown, 'ImportError', E.toString());
        }
    },
            [{name: 'path', type: types.string}],
            'import', undefined, types.object
    ), {
        forceThroughConst: true,
        isConstant: true
    });

    context.setOwn('open', new ESFunction(({context}, path_, encoding_) => {
        if (!permissions.fileSystem) {
            return new PermissionRequiredError('No access to file system');
        }

        const path = str(path_);
        const encoding = str(encoding_) || 'utf-8';

        if (!fs.existsSync(path)) {
            return new ImportError(Position.unknown, path);
        }

        return new ESObject({
            str: new ESFunction(({context}) => {
                return new ESString(fs.readFileSync(context.path + path, encoding));
            }, [], 'str', undefined, types.string),

            write: new ESFunction(({context}, data: Primitive) => {
                fs.writeFileSync(context.path + path, str(data));
            }, [{name: 'path', type: types.string}]),

            append: new ESFunction(({context}, data: Primitive) => {
                fs.appendFileSync(context.path + path, str(data));
            }, [{name: 'path', type: types.string}]),
        });
    }));
}

export default addNodeLibs;