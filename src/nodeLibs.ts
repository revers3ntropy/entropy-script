import {Position} from "./position.js";
import {global} from "./constants.js";
import {Context} from "./context.js";
import { ESError, TypeError } from "./errors.js";
import { ESFunction, ESObject } from "./primitiveTypes.js";

type serverOptions = {
    key?: string,
    cert?: string,
    port?: number,
    hostname?: string,
    secure?: boolean,
    debug?: boolean,
    corsOrigin?: string,
};

function addNodeLibs (https: any, http: any, fs: any, mysql: any) {
    global.set('nodeHTTPS', https);
    global.set('nodeHTTP', http);

    global.set('https', new ESObject({
        createServer: new ESFunction((options: serverOptions, handlers: {[path: string]: ESFunction}) => {
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
                            console.log(`Error parsing JSON data from URL ${req.url} with JSON ${data}: ${E}`)
                            return;
                        }

                        const fn = handlers[url];
                        if (!fn) {
                            console.error(`Not handler found for url '${url}'`)
                            return;
                        }

                        const context = new Context();
                        context.parent = global;
                        context.set('body', new ESObject(body));
                        const esRes = fn.__call__([], context);

                        if (esRes instanceof ESError) {
                            console.log(esRes.str);
                            return;
                        }

                        let response = '';
                        try {
                            if (['String', 'Number'].indexOf(esRes.typeOf().valueOf()) !== -1)
                                // @ts-ignore
                                esRes.val = {value: esRes.val};

                            response = JSON.stringify(esRes);
                        } catch (e) {
                            console.log(`Incorrect return value for handler of ${url}. Must be JSONifyable.`)
                            if (options.debug)
                                console.log(`Detail: Expected type (object|undefined) but got value ${esRes.valueOf()} of type ${esRes.typeOf()}`);
                            return;
                        }

                        if (options.debug)
                            console.log(`Response: ${response}`);

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
                        console.log(`Server running at https://${options.hostname}:${options.port}`);
                    });
                else
                    server.listen(options.port, () => {
                        console.log(`Server running on port ${options.port}`);
                    });


            } else
                http.createServer(handler)
                    .listen(options.port, options.hostname, () => {
                        console.log(`Server running at http://${options.hostname}:${options.port}`);
                    });
        })
    }));

    global.set('open', new ESFunction((path: string, encoding='utf8') => {
        return {
            str: () => {
                return fs.readFileSync(path, encoding);
            },
            write: (data: string) => {
                if (typeof data !== "string")
                    return new TypeError(Position.unknown, 'string', typeof data, data, 'Can only write strings to files');

                fs.writeFileSync(path, data);
            },
            append: (data: string) => {
                if (typeof data !== "string")
                    return new TypeError(Position.unknown, 'string', typeof data, data, 'Can only write strings to files');

                fs.appendFileSync(path, data);
            },
        };
    }));

    global.set('mysql', new ESFunction((options: {
        host: string,
        user: string,
        password: string,
        database: string
    }) => {
        const connection: any = new mysql(options);
        return (query: string) => connection.query(query);
    }));
}

export default addNodeLibs;