import {N_any, N_function, N_functionCall} from "./nodes.js";
import {Position} from "./position.js";
import {global} from "./constants.js";

type serverOptions = {
    key: string,
    cert: string,
    port: number
}

async function addHTTPS (globalConstants: any) {
    const https = await import('https');
    globalConstants['nodeHTTPS'] = https;

    globalConstants['https'] = {
        createServer: (options: serverOptions, handlers: {[path: string]: N_function}) => {
            https.createServer({
                key: options.key,
                cert: options.cert
            }, (req, res) => {

                const url: string = req.url || '/';

                if (handlers.hasOwnProperty(url)) {
                    const runner = new N_functionCall(Position.unknown, handlers[url], [new N_any(req)]);
                    const esRes = runner.interpret(global);
                    if (esRes.error) {
                        console.log(esRes.error.str);
                        return;
                    }
                    res.end(esRes.val?.toString() ?? '');
                }

            }).listen(options.port);
        }
    };
}

export default addHTTPS;