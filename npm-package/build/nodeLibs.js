import { global } from "./constants.js";
import { Context } from "./context.js";
import { ESError } from "./errors.js";
import { ESFunction, ESObject, ESPrimitive, ESString, types } from "./primitiveTypes.js";
function addNodeLibs(https, http, fs, mysql) {
    global.set('nodeHTTPS', https);
    global.set('nodeHTTP', http);
    global.set('https', new ESObject({
        createServer: new ESFunction((options_, handlers_) => {
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
                            console.log(`Error parsing JSON data from URL ${req.url} with JSON ${data}: ${E}`);
                            return;
                        }
                        const fn = handlers[url];
                        if (!fn) {
                            console.error(`Not handler found for url '${url}'`);
                            return;
                        }
                        const context = new Context();
                        context.parent = fn.__closure__;
                        context.set('body', new ESObject(body));
                        fn.__closure__ = context;
                        const esRes = fn.__call__([]);
                        if (esRes instanceof ESError) {
                            console.log(esRes.str);
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
                            console.log(`Incorrect return value for handler of ${url}. Must be JSONifyable.`);
                            if (options.debug)
                                console.log(`Detail: Expected type (object|undefined) but got value ${esRes.valueOf()} of type ${esRes.typeOf()}`);
                            res.writeHead(500);
                            res.end(`{}`);
                            return;
                        }
                        if (options.debug)
                            console.log(`Response: ${response}`);
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
                        console.log(`Server running at https://${options.hostname}:${options.port}`);
                    });
                else
                    server.listen(options.port, () => {
                        console.log(`Server running on port ${options.port}`);
                    });
            }
            else
                http.createServer(handler)
                    .listen(options.port, options.hostname, () => {
                    console.log(`Server running at http://${options.hostname}:${options.port}`);
                });
        })
    }));
    global.set('open', new ESFunction((path_, encoding_) => {
        const path = path_.valueOf();
        const encoding = (encoding_ === null || encoding_ === void 0 ? void 0 : encoding_.valueOf()) || 'utf-8';
        return new ESObject({
            str: new ESFunction(() => {
                return new ESString(fs.readFileSync(path, encoding));
            }, [], 'str', undefined, types.string),
            write: new ESFunction((data) => {
                fs.writeFileSync(path, data.str().valueOf());
            }),
            append: new ESFunction((data) => {
                fs.appendFileSync(path, data.str().valueOf());
            }),
        });
    }));
    global.set('mysql', new ESFunction(options_ => {
        const options = options_.valueOf();
        const connection = new mysql(options);
        return new ESFunction((query) => connection.query(query.valueOf()), [], 'queryMySQL');
    }));
}
export default addNodeLibs;
