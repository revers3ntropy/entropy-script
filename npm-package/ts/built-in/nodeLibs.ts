import {Position} from "../position.js";
import {Context} from "../runtime/context.js";
import {ESError, ImportError} from "../errors.js";
import {ESFunction, ESNamespace, ESObject, ESString, Primitive, types} from '../runtime/primitiveTypes.js';
import {str} from "../util/util.js";
import {interpretResult} from "../runtime/nodes.js";
import {run} from "../index.js";
import {addModuleFromObj, getModule, moduleExist} from './builtInModules.js';

// node only built in modules
import http from './built-in-modules/http.js';

function addNodeLibs (https_lib: any, http_lib: any, fs: any, mysql: any, context: Context, print: (...args: string[]) => void) {

    addModuleFromObj('http', http(https_lib, http_lib, fs, mysql, context, print));

    context.set('import', new ESFunction(({context}, rawPath) => {
        const path: string = str(rawPath);

        if (moduleExist(path))
            return getModule(path);

        try {
            if (!fs.existsSync(path))
                return new ESError(Position.unknown, 'ImportError', `Can't find file '${path}' to import.`)
            const code = fs.readFileSync(path, 'utf-8');
            const env = new Context();
            env.parent = context;
            const res: interpretResult = run(code, {
                env,
                fileName: path
            });

            if (res.error)
                return print(new ImportError(Position.unknown, str(path), res.error.str).str);

            return new ESNamespace(new ESString(path), env.getSymbolTableAsDict());
        } catch (E) {
            return new ESError(Position.unknown, 'ImportError', E.toString());
        }
    }, [{name: 'path', type: types.string}],
        'import', undefined, types.object),
    {
        forceThroughConst: true,
        isConstant: true
    });

    context.setOwn('open', new ESFunction((path_, encoding_) => {
        const path = <string>path_.valueOf();
        const encoding = (<string>encoding_?.valueOf()) || 'utf-8';
        return new ESObject({
            str: new ESFunction(({context}) => {
                return new ESString(fs.readFileSync(path, encoding));
            }, [], 'str', undefined, types.string),
            write: new ESFunction(({context}, data: Primitive) => {
                fs.writeFileSync(path, str(data));
            }),
            append: new ESFunction(({context}, data: Primitive) => {
                fs.appendFileSync(path, str(data));
            }),
        });
    }));
}

export default addNodeLibs;