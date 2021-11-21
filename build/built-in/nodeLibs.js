import { Position } from "../position.js";
import { Context } from "../runtime/context.js";
import { ESError, ImportError } from "../errors.js";
import { ESFunction, ESNamespace, ESObject, ESPrimitive, ESString, types } from "../runtime/primitiveTypes.js";
import { str } from "../util/util.js";
import { run } from "../index.js";
import { getModule, moduleExist } from './builtInModules.js';
function addNodeLibs(https, http, fs, mysql, context, print) {
    context.set('import', new ESFunction(({ context }, rawPath) => {
        const path = str(rawPath);
        if (moduleExist(path))
            return getModule(path);
        try {
            if (!fs.existsSync(path))
                return new ESError(Position.unknown, 'ImportError', `Can't find file '${path}' to import.`);
            const code = fs.readFileSync(path, 'utf-8');
            const env = new Context();
            env.parent = context;
            const res = run(code, {
                env,
                fileName: path
            });
            if (res.error)
                return print(new ImportError(Position.unknown, str(path), res.error.str).str);
            return new ESNamespace(new ESString(path), env.getSymbolTableAsDict());
        }
        catch (E) {
            return new ESError(Position.unknown, 'ImportError', E.toString());
        }
    }, [{ name: 'path', type: types.string }], 'import', undefined, types.object), {
        forceThroughConst: true,
        isConstant: true
    });
    context.setOwn('https', new ESObject({
        createServer: new ESFunction(({ context }, options_, handlers_) => {
            let options = ESPrimitive.strip(options_);
            let handlers = ESPrimitive.strip(handlers_);
            options = Object.assign({ port: 3000, secure: false, debug: false }, options);
            const handler = (req, res) => {
                if (options.corsOrigin)
                    res.setHeader("Access-Control-Allow-Origin", options.corsOrigin);
                const url = req.url || '/';
                if (options.debug)
                    console.log(`Got request at ${url}`);
                if (handlers.hasOwnProperty(url)) {
                    let data = '';
                    // need to get the data one packet at a time, and then deal with the whole lot at once
                    req.on('data', (chunk) => {
                        data += chunk;
                    });
                    req.on('end', () => {
                        // the POST body has fully come through, continue on now
                        res.writeHead(200);
                        let body = {};
                        try {
                            body = JSON.parse(data !== null && data !== void 0 ? data : '{}');
                        }
                        catch (E) {
                            print(`Error parsing JSON data from URL ${req.url} with JSON ${data}: ${E}`);
                            return;
                        }
                        const fn = handlers[url];
                        if (!fn) {
                            print(`Not handler found for url '${url}'`);
                            return;
                        }
                        const context = new Context();
                        context.parent = fn.__closure__;
                        context.set('body', new ESObject(body));
                        fn.__closure__ = context;
                        const esRes = fn.__call__([]);
                        if (esRes instanceof ESError) {
                            print(esRes.str);
                            res.writeHead(500);
                            res.end(`{}`);
                            return;
                        }
                        let response = '';
                        try {
                            if (esRes instanceof ESObject) {
                                response = JSON.stringify(ESPrimitive.strip(esRes));
                            }
                            else {
                                res.writeHead(500);
                                res.end(`{}`);
                                return;
                            }
                        }
                        catch (e) {
                            print(`Incorrect return value for handler of ${url}. Must be JSONifyable.`);
                            if (options.debug)
                                print(`Detail: Expected type (object|undefined) but got value ${esRes.valueOf()} of type ${esRes.typeOf()}`);
                            res.writeHead(500);
                            res.end(`{}`);
                            return;
                        }
                        if (options.debug)
                            print(`Response: ${response}`);
                        res.end(response);
                    });
                }
                else {
                    res.writeHead(404);
                    res.end(`{}`);
                }
            };
            if (options.secure) {
                const server = https.createServer({
                    key: options.key,
                    cert: options.cert
                }, handler);
                if (options.hostname)
                    server.listen(options.port, options.hostname, () => {
                        print(`Server running at https://${options.hostname}:${options.port}`);
                    });
                else
                    server.listen(options.port, () => {
                        print(`Server running on port ${options.port}`);
                    });
            }
            else
                http.createServer(handler)
                    .listen(options.port, options.hostname, () => {
                    print(`Server running at http://${options.hostname}:${options.port}`);
                });
        })
    }));
    context.setOwn('open', new ESFunction((path_, encoding_) => {
        const path = path_.valueOf();
        const encoding = (encoding_ === null || encoding_ === void 0 ? void 0 : encoding_.valueOf()) || 'utf-8';
        return new ESObject({
            str: new ESFunction(() => {
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
    context.setOwn('mysql', new ESFunction(({ context }, options_) => {
        const options = options_.valueOf();
        const connection = new mysql(options);
        return new ESFunction(({ context }, query) => connection.query(query.valueOf()), [], 'queryMySQL');
    }));
}
export default addNodeLibs;
