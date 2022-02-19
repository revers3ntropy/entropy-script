import { ESError } from '../../errors.js';
import { Context } from '../../runtime/context.js';
import { strip } from '../../runtime/primitives/wrapStrip.js';
import { ESFunction, ESObject, types } from '../../runtime/primitiveTypes.js';
import { str } from '../../util/util.js';
import { ESJSBinding } from "../../runtime/primitives/esjsbinding.js";
const module = ({ https, http, print, fetch }) => ({
    fetch: new ESFunction((props, url, options, callback) => {
        fetch(str(url), strip(options, props));
    }, [
        { name: 'uri', type: types.string },
        { name: 'options', type: types.object },
        { name: 'callback', type: types.function }
    ], 'fetch', undefined, types.undefined),
    createServer: (props, options_, handlers_) => {
        let options = strip(options_, props);
        let handlers = strip(handlers_, props);
        options = Object.assign({ port: 3000, secure: false, debug: false }, options);
        const handler = (req, res) => {
            if (options.corsOrigin)
                res.setHeader("Access-Control-Allow-Origin", options.corsOrigin);
            const url = req.url || '/';
            if (options.debug) {
                console.log(`Got request at ${url}`);
            }
            if (handlers.hasOwnProperty(url)) {
                let data = '';
                req.on('data', (chunk) => {
                    data += chunk;
                });
                req.on('end', () => {
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
                    fn.__closure__ = context;
                    const esRes = fn.__call__({ context }, new ESJSBinding(body));
                    if (esRes instanceof ESError) {
                        print(esRes.str);
                        res.writeHead(500);
                        res.end(`{}`);
                        return;
                    }
                    let response = '';
                    try {
                        if (esRes instanceof ESObject) {
                            response = JSON.stringify(strip(esRes, { context }));
                        }
                        else {
                            res.writeHead(500);
                            res.end(`{}`);
                            return;
                        }
                    }
                    catch (e) {
                        print(`Incorrect return value for handler of ${url}. Must be JSONifyable.`);
                        if (options.debug) {
                            print(`Detail: Expected type (object|undefined) but got value ${esRes.valueOf()} of type ${esRes.typeName()}`);
                        }
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
    }
});
export default module;
