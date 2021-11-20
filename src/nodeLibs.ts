import {Position} from "./position.js";
import {Context} from "./context.js";
import {ESError, ImportError} from "./errors.js";
import {ESFunction, ESNamespace, ESObject, ESPrimitive, ESString, Primitive, types} from "./primitiveTypes.js";
import {str} from "./util.js";
import {interpretResult} from "./nodes.js";
import {run} from "./index.js";

type serverOptions = {
    key?: string,
    cert?: string,
    port?: number,
    hostname?: string,
    secure?: boolean,
    debug?: boolean,
    corsOrigin?: string,
};

function addNodeLibs (https: any, http: any, fs: any, mysql: any, context: Context, print: (...args: string[]) => void) {
    context.setOwn('nodeHTTPS', ESPrimitive.wrap(https));
    context.setOwn('nodeHTTP', ESPrimitive.wrap(http));

    context.set('import', new ESFunction((rawPath) => {
        const path: string = str(rawPath);
        try {
            const code = fs.readFileSync(path, 'utf-8');
            const env = new Context();
            env.parent = context;
            const res: interpretResult = run(code, {
                env,
                fileName: path
            });

            if (res.error)
                return new ImportError(Position.unknown, str(path), res.error.str).str;

            return new ESNamespace(new ESString(path), env.getSymbolTableAsDict());
        } catch (E) {
            return new ESError(Position.unknown, 'ImportError', E.toString());
        }
    }, [{name: 'path', type: types.string}], 'import', undefined, types.object), {
        forceThroughConst: true,
        isConstant: true
    });

    context.setOwn('https', new ESObject({
        createServer: new ESFunction((options_: Primitive, handlers_: Primitive) => {
            let options: serverOptions = ESPrimitive.strip(options_);
            let handlers: {[path: string]: ESFunction} = ESPrimitive.strip(handlers_);

            options = {
                port: 3000,
                secure: false,
                debug: false,
                ...options
            };

            const handler = (req: any, res: any) => {

                if (options.corsOrigin)
                    res.setHeader("Access-Control-Allow-Origin", options.corsOrigin);

                const url: string = req.url || '/';

                if (options.debug)
                    console.log(`Got request at ${url}`);

                if (handlers.hasOwnProperty(url)) {
                    let data = '';
                    // need to get the data one packet at a time, and then deal with the whole lot at once
                    req.on('data', (chunk: any) => {
                        data += chunk;
                    });

                    req.on('end', () => {
                        // the POST body has fully come through, continue on now

                        res.writeHead(200);

                        let body = {};
                        try {
                            body = JSON.parse(data ?? '{}');
                        } catch (E) {
                            print(`Error parsing JSON data from URL ${req.url} with JSON ${data}: ${E}`)
                            return;
                        }

                        const fn = handlers[url];
                        if (!fn) {
                            print(`Not handler found for url '${url}'`)
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
                            } else {
                                res.writeHead(500);
                                res.end(`{}`);
                                return;
                            }
                        } catch (e) {
                            print(`Incorrect return value for handler of ${url}. Must be JSONifyable.`)
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

                } else {
                    res.writeHead(404);
                    res.end(`{}`);
                }
            }

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


            } else
                http.createServer(handler)
                    .listen(options.port, options.hostname, () => {
                        print(`Server running at http://${options.hostname}:${options.port}`);
                    });
        })
    }));

    context.setOwn('open', new ESFunction((path_, encoding_) => {
        const path = <string>path_.valueOf();
        const encoding = (<string>encoding_?.valueOf()) || 'utf-8';
        return new ESObject({
            str: new ESFunction(() => {
                return new ESString(fs.readFileSync(path, encoding));
            }, [], 'str', undefined, types.string),
            write: new ESFunction((data: Primitive) => {
                fs.writeFileSync(path, str(data));
            }),
            append: new ESFunction((data: Primitive) => {
                fs.appendFileSync(path, str(data));
            }),
        });
    }));

    context.setOwn('mysql', new ESFunction(options_ => {
        const options: {
            host: string,
                user: string,
                password: string,
                database: string
        } = options_.valueOf();
        const connection: any = new mysql(options);
        return new ESFunction((query: Primitive) => connection.query(query.valueOf()), [], 'queryMySQL');
    }));
}

export default addNodeLibs;