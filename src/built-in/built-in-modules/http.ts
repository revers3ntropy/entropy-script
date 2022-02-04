import {ESError} from '../../errors.js';
import {Context} from '../../runtime/context.js';
import {ESFunction, ESObject, ESPrimitive, types} from '../../runtime/primitiveTypes.js';
import {str} from '../../util/util.js';
import type {JSModuleFunc, JSModule} from './module.js';

type serverOptions = {
    key?: string,
    cert?: string,
    port?: number,
    hostname?: string,
    secure?: boolean,
    debug?: boolean,
    corsOrigin?: string,
};

const module: JSModuleFunc = ({https, http, print, fetch}): JSModule => ({
    fetch: new ESFunction(({context}, url, options, callback) => {
        fetch(str(url), ESPrimitive.strip(options));
    }, [
        {name: 'uri', type: types.string},
        {name: 'options', type: types.object},
        {name: 'callback', type: types.function}
    ], 'fetch', undefined, types.undefined),
    createServer:({context}, options_, handlers_) => {
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
                    const esRes = fn.__call__({context});

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
    }
});

export default module;