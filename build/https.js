import { N_any, N_functionCall } from "./nodes.js";
import { Position } from "./position.js";
import { global } from "./constants.js";
import { Context } from "./context.js";
function addHTTPS(https, http) {
    global.set('nodeHTTPS', https);
    global.set('nodeHTTP', http);
    global.set('https', {
        createServer: (options, handlers) => {
            options = Object.assign({ port: 3000, secure: false, debug: false }, options);
            const handler = (req, res) => {
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
                        const runner = new N_functionCall(Position.unknown, handlers[url], []);
                        const context = new Context();
                        context.parent = global;
                        context.set('body', new N_any(body));
                        const esRes = runner.interpret(context);
                        if (esRes.error) {
                            console.log(esRes.error.str);
                            return;
                        }
                        esRes.val || (esRes.val = {});
                        let response = '';
                        try {
                            if (['string', 'number'].indexOf(typeof esRes.val) !== -1)
                                // @ts-ignore
                                esRes.val = { value: esRes.val };
                            response = JSON.stringify(esRes.val);
                        }
                        catch (e) {
                            console.log(`Incorrect return value for handler of ${url}. Must be JSONifyable.`);
                            if (options.debug)
                                console.log(`Detail: Expected type (object|undefined) but got value ${esRes.val} of type ${esRes.type}`);
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
                        console.log(`Server running at https://${options.hostname}:${options.port}`);
                    });
            }
            else
                http.createServer(handler)
                    .listen(options.port, options.hostname, () => {
                    console.log(`Server running at http://${options.hostname}:${options.port}`);
                });
        }
    });
}
export default addHTTPS;
