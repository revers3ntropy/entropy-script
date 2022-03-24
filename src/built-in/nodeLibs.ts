import Position from "../position";
import {Context} from "../runtime/context";
import {ESError, ImportError, PermissionRequiredError} from '../errors';
import {ESFunction, ESNamespace, ESObject, ESString, Primitive} from '../runtime/primitiveTypes';
import { str } from "../util/util";
import {interpretResult} from "../runtime/nodes";
import { config, run } from '../index';
import {JSModuleParams} from './module';
import { addModule, getModule, moduleExist } from './builtInModules';
import { global, types, VALID_FILE_ENCODINGS } from "../constants";
import { ESJSBinding } from "../runtime/primitives/esjsbinding";

/**
 * Adds node functionality like access to files, https and more.
 * @param {JSModuleParams} libs
 * @param {Context} context
 */
function addNodeLibs (libs: JSModuleParams, context: Context) {

    const { fs, path } = libs;

    for (let libName of Object.keys(libs)) {
        addModule(libName, new ESJSBinding(libs[libName], libName));
    }

    context.set('import', new ESFunction(({context}, rawPath): ESError | Primitive | undefined => {

        if (!config.permissions.imports) {
            return new PermissionRequiredError('Imports not allowed');
        }

        let scriptPath: string = str(rawPath);

        if (config.permissions.useSTD && moduleExist(scriptPath)) {
            return getModule(scriptPath);
        }

        scriptPath = path.join(context.path, scriptPath);

        try {
            if (!fs.existsSync(scriptPath)) {
                if (fs.existsSync('./particles/' + scriptPath)) {
                    if (fs.existsSync('particles/' + scriptPath + '/main.es')) {
                        scriptPath = 'particles/' + scriptPath + '/main.es';
                    } else {
                        return new ESError(Position.void, 'ImportError', `Module '${scriptPath}' has no entry point. Requires 'main.es'.`)
                    }
                } else {
                    return new ESError(Position.void, 'ImportError', `Can't find file '${scriptPath}' to import.`)
                }
            }

            const exDir = path.dirname(scriptPath);

            const code = fs.readFileSync(scriptPath, 'utf-8');
            const env = new Context();
            env.parent = global;
            env.path = exDir;

            const n = new ESNamespace(new ESString(scriptPath), {});

            const res: interpretResult = run(code, {
                env,
                fileName: scriptPath,
                currentDir: exDir,
            });

            n.__value__ = env.getSymbolTableAsDict();

            if (res.error) {
                return res.error;
            }
            return n;

        } catch (E: any) {
            return new ESError(Position.void, 'ImportError', E.toString());
        }
    },
            [{name: 'path', type: types.string}],
            'import', undefined, types.object
    ), {
        forceThroughConst: true,
        isConstant: true
    });



    context.setOwn('open', new ESFunction(({context}, path_, encoding_) => {
        if (!config.permissions.fileSystem) {
            return new PermissionRequiredError('No access to file system');
        }

        const filePath = str(path_);
        let encoding = str(encoding_);

        if (VALID_FILE_ENCODINGS.indexOf(encoding) === -1) {
            encoding = 'utf-8';
        }

        if (!fs.existsSync(filePath)) {
            return new ImportError(Position.void, filePath);
        }

        return new ESObject({
            str: new ESFunction(({context}) => {
                return new ESString(fs.readFileSync(path.join(context.path, filePath), encoding).toString());
            }, [], 'str', undefined, types.string),

            write: new ESFunction(({context}, data: Primitive) => {
                fs.writeFileSync(context.path + filePath, str(data));
            }, [{name: 'path', type: types.string}]),

            append: new ESFunction(({context}, data: Primitive) => {
                fs.appendFileSync(context.path + filePath, str(data));
            }, [{name: 'path', type: types.string}]),
        });
    }));
}

export default addNodeLibs;