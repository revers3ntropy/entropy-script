import Position from "../position";
import {Context} from "../runtime/context";
import { ESError, ImportError, MissingNativeDependencyError, PermissionRequiredError } from '../errors';
import {ESFunction, ESNamespace, ESObject, ESString, Primitive} from '../runtime/primitiveTypes';
import { funcProps, str } from "../util/util";
import {interpretResult} from "../runtime/nodes";
import { config, libs, run } from '../index';
import { getModule, moduleExist } from './builtInModules';
import { global, types, VALID_FILE_ENCODINGS } from "../constants";

const open = (props: funcProps, path_: Primitive, encoding_: Primitive) => {
    if (!config.permissions.fileSystem) {
        return new PermissionRequiredError('No access to file system');
    }

    if (!('path' in libs)) {
        return new MissingNativeDependencyError('path');
    }

    if (!('fs' in libs)) {
        return new MissingNativeDependencyError('fs');
    }

    const {path, fs} = libs;

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
};

const import_ = (props: funcProps, rawPath: Primitive): ESError | Primitive | undefined => {

    if (!config.permissions.imports) {
        return new PermissionRequiredError('Imports not allowed');
    }

    let scriptPath: string = str(rawPath);

    if (config.permissions.useSTD && moduleExist(scriptPath)) {
        return getModule(scriptPath);
    }

    if (!('path' in libs)) {
        return new MissingNativeDependencyError('path');
    }

    if (!('fs' in libs)) {
        return new MissingNativeDependencyError('fs');
    }

    const {path, fs} = libs;

    scriptPath = path.join(props.context.path, scriptPath);

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
}

/**
 * Adds node built-in-functions like 'open'
 * @param {Context} context
 */
function addNodeBIFs (context: Context) {

    context.set('import', new ESFunction(import_,
            [{name: 'path', type: types.string}],
            'import', undefined, types.object
    ), {
        forceThroughConst: true,
        isConstant: true
    });

    context.set('open', new ESFunction(open,
        [
            {name: 'path', type: types.string},
            {name: 'encoding', type: types.string}
        ],
        'open', undefined, types.object
    ), {
        forceThroughConst: true,
        isConstant: true
    });
}

export default addNodeBIFs;