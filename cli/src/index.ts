/**
 * Entropy Script for Node.js
 *
 * Syntax:
 *
 * >> node cli ./path/to/script.es
 * will run a script
 *
 * >> node cli
 * will start the REPL
 */

// node libs that scripts should have access to
import https from 'https';
import http from 'http';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import commandLineArgs from 'command-line-args';

import * as es from '../../src/index';

export const flags = {
    compile: false,
    minify: false,
    outputPy: '',
    outputJS: '',
    path: '',
    ...commandLineArgs([
        { name: 'compile', type: Boolean, alias: 'c' },
        { name: 'outputJS', type: String },
        { name: 'outputPy', type: String },
        { name: 'minify', type: Boolean, alias: 'm' },
        { name: 'path', type: String, alias: 'p', defaultOption: true },
    ]),
};

/**
 * Syntax: await askQuestion(query).
 * Waits for Node I/O and when the user inputs something from the command line returns the line.
 * @param {string} query
 * @return {Promise<string>}
 */
function askQuestion(query: string) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, (ans: unknown) => {
        rl.close();
        resolve(ans);
    }));
}

/**
 * @return {Promise<void>}
 */
async function init () {
    const err = await es.init({
        print: console.log,
        input: async (msg: any, cb: (arg0: unknown) => any) => cb(await askQuestion(msg).catch(console.log)),
        libs: {
            https: [https, true],
            http: [http, true],
            fs: [fs, true],
            path: [path, true],
            fetch: [fetch, true]
        }
    });

    if (err instanceof es.Error) {
        console.log(err.str);
    }

    if (fs.existsSync(es.CONFIG_FILE_NAME)) {
        es.parseConfig(JSON.parse(fs.readFileSync(es.CONFIG_FILE_NAME).toString()));
    }
}

/**
 * Runs a .es script
 */
function runScript (file: string) {

    if (file.substring(file.length-3) !== '.es') {
        file = file + '.es';
    }

    if (!fs.existsSync(file)) {
        console.log(new es.ImportError(
            file,
            `Can't resolve file '${file}'`
        ).position(new es.Position(0, 0, 0, 'JSES-CLI')).str);
        return;
    }

    const wrappedArgv = new es.ESArray(process.argv.map(s => new es.ESString(s)));

    const env = new es.Context();
    env.parent = es.global;
    env.setOwn('args', wrappedArgv, {
        isConstant: true
    });

    const res = es.run(fs.readFileSync(file, 'utf-8').toString(), {
        env,
        fileName: file,
        currentDir: path.dirname(file),
        compileToJS: flags.compile,
        compileJSConfig: {
            minify: false,
            indent: 0,
            symbols: []
        }
    });
    if (res.error) {
        console.log(res.error.str);
    }
}

/**
 * Starts the terminal
 * @return {Promise<void>}
 */
async function runTerminal () {
    let input = String(await askQuestion('>>> '));

    if (input === 'exit') {
        return;
    }

    if (input === 'help') {
        // assume that the user wants help, so make it run the 'help' function.
        input = 'help(*NoParam=1)';
    }

    const res = es.run(input, {
        fileName: 'JSES-REPL'
    });

    if (res.error) {
        console.log(res.error.str);
        runTerminal();
        return;
    }

    const out = res.val?.__value__;

    if (out === undefined) {
        console.log( '--undefined--');
        runTerminal();
        return;
    }

    for (const item of out) {
        console.log(es.str(item));
    }

    runTerminal();
}

/**
 *
 */
async function compile (path: string, outPath: string) {
    const {
        compileToJavaScript,
        compileToPython,
        error: parseErr
    } = es.parse(fs.readFileSync(path).toString());

    if (parseErr) {
        console.log(parseErr.str);
        return;
    }

    const options = {
        minify: flags.minify,
        indent: 0,
        symbols: []
    }

    let val, error;

    if (flags.outputPy) {
        const res = compileToPython(options);
        val = res.val;
        error = res.error;
    } else {
        const res = compileToJavaScript(options);
        val = res.val;
        error = res.error;
    }

    if (error) {
        console.log(error.str);
    }

    fs.writeFileSync(outPath, val);
}

/**
 * @returns {void}
 */
function welcomeMessage () {
    console.log(`Welcome to Entropy Script JS [esjs@${es.VERSION}, nodejs@${process.versions.node}]`);
    console.log("Type 'exit' to exit, 'help' for more information");
}

/**
 * @returns {Promise<void>}
 */
async function main () {
    await init();

    if (flags.outputJS) {
        return compile(flags.path, flags.outputJS);
    }
    if (flags.outputPy) {
        return compile(flags.path, flags.outputPy);
    }

    if (!flags.path) {
        welcomeMessage();
        return runTerminal();
    }

    runScript(flags.path);
}

main();