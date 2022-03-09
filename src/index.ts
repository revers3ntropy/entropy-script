import { Lexer } from "./parse/lexer";
import { Parser } from "./parse/parser";
import {
    type compileConfig,
    global,
    libs as allLibs,
    now,
    refreshPerformanceNow,
    runningInNode,
    setGlobalContext,
    VERSION
} from "./constants";
import { initialise } from "./init";
import { ESError } from "./errors";
import { Position } from "./position";
import { compileResult, interpretResult, Node } from "./runtime/nodes";
import { ESArray } from "./runtime/primitiveTypes";
import { timeData } from "./util/util";
import { Context } from "./runtime/context";
import addNodeLibs from "./built-in/nodeLibs";
import { JSModuleParams } from "./built-in/module";
import colours from './util/colours';

// @ts-ignore
import JS_STD_TXT_RAW from 'raw-loader!./built-in/compiledSTD/std.txt.js';

// @ts-ignore
import PY_STD_TXT_RAW from 'raw-loader!./built-in/compiledSTD/std.txt.py';

export {
    Context,
    colours
};

export * from './runtime/primitiveTypes';
export * from './constants';
export * from './errors';
export * from './runtime/nodes';
export * from './util/util';
export * from './runtime/primitives/wrapStrip';
export * from './runtime/symbol';

/**
 * @param {(...args: any) => void} printFunc
 * @param {(msg: string, cb: (...arg: any[]) => any) => void} inputFunc
 * @param {boolean} node
 * @param libs
 * @param {Context} context
 * @param {string} path
 * @returns {Promise<void | ESError>}
 */
export async function init (
    printFunc: (...args: any[]) => void = console.log,
    inputFunc: (msg: string, cb: (...arg: any[]) => any) => void,
    node= true,
    libs: JSModuleParams = {print: console.log},
    context= new Context(),
    path = '',
): Promise<ESError | undefined> {

    const res = initialise(context, printFunc, inputFunc);
    if (res instanceof ESError) {
        return res;
    }

    setGlobalContext(context);

    libs['context'] ??= context;

    if (path) {
        context.path = path;
    }

    if (libs.print) {
        allLibs.print = libs.print;
    }

    if (node) {
        runningInNode();
        await refreshPerformanceNow(true);
        addNodeLibs(libs, context);
    }
}

/**
 * @param {string} msg
 * @param {Context} env
 * @param {boolean} measurePerformance
 * @param {string} fileName
 * @param {string} currentDir
 * @returns {interpretResult | ({timeData: timeData} & interpretResult)}
 */
export function run (msg: string, {
    env = global,
    measurePerformance = false,
    fileName = '(unknown)',
    currentDir=''
} = {}): interpretResult | ({ timeData: timeData } & interpretResult) {

    if (currentDir) {
        env.path = currentDir;
    }

    Node.maxTime = 0;
    Node.totalTime = 0;
    Node.interprets = 0;

    const timeData: timeData = {
        total: 0,
        lexerTotal: 0,
        parserTotal: 0,
        interpretTotal: 0,
        nodeMax: 0,
        nodeAvg: 0,
        nodeTotal: 0,
        interprets: 0,
    }

    let start = now();

    if (!env.root.initialisedAsGlobal){
        const res = new interpretResult();
        res.error = new ESError(
            Position.void,
            'Uninitialised',
            'Global context has not been initialised with global values'
        );
        return res;
    }

    const lexer = new Lexer(msg, fileName);
    const lexerRes = lexer.generate();
    if (lexerRes instanceof ESError) {
        const res_ = new interpretResult();
        res_.error = lexerRes;
        return res_;
    }
    timeData.lexerTotal = now() - start;
    start = now();

    const parser = new Parser(lexerRes);
    const res = parser.parse();
    if (res.error) {
        const res_ = new interpretResult();
        res_.error = res.error;
        return res_;
    }
    timeData.parserTotal = now() - start;
    start = now();


    if (!res.node) {
        const res = new interpretResult();
        res.val = new ESArray([]);
        return res;
    }

    const finalRes = res.node.interpret(env);
    timeData.interpretTotal = now() - start;
    timeData.total = now() - start;

    timeData.nodeMax = Node.maxTime;
    timeData.nodeTotal = Node.totalTime;
    timeData.nodeAvg = Node.totalTime / Node.interprets;
    timeData.interprets = Node.interprets;

    if (measurePerformance) {
        console.log(timeData);
    }

    return {...finalRes, timeData};
}

export function parse (code: string, {
    fileName = '(unknown)',
    currentDir=''
} = {}) {

    const lexer = new Lexer(code, fileName);
    const lexerRes = lexer.generate();
    if (lexerRes instanceof ESError) {
        return {
            error: lexerRes
        };
    }

    const parser = new Parser(lexerRes);
    const res = parser.parse();
    if (res.error) {
        return {
            error: res.error
        };
    }

    if (!res.node) {
        return {
            error: new ESError(Position.void, 'Error', 'no output')
        };
    }

    return {
        compileToJavaScript: (config: compileConfig): compileResult => {
            if (!res.node) throw 'res.node still undefined';
            const comment = `// Generated by EntropyScript->JavaScript compiler v${VERSION}\n`;
            const stdStr = JS_STD_TXT_RAW.toString().replace(/(\r\n|\n|\r|\t| )+/gm, ' ') + '\n';
            const out = res.node.compileJS(config);
            if (out.error) return out;
            if (config.minify) {
                out.val = out.val.replace(/(\r\n|\n|\r|\t| )+/gm, ' ');
            }
            return new compileResult(comment + stdStr + out.val);
        },

        compileToPython: (config: compileConfig): compileResult => {
            if (!res.node) throw 'res.node still undefined';
            const comment = `# Generated by EntropyScript->Python compiler v${VERSION}\n\n`;
            const stdStr = PY_STD_TXT_RAW.toString() + '\n';
            const out = res.node.compilePy(config);
            if (out.error) return out;
            return new compileResult(comment + stdStr + out.hoisted + '\n' + out.val);
        },

        interpret: (env=global): interpretResult => {
            if (!res.node) throw 'res.node still undefined';

            if (currentDir) {
                env.path = currentDir;
            }

            if (!env.root.initialisedAsGlobal){
                const res = new interpretResult();
                res.error = new ESError(Position.void, 'Uninitialised',
                    'Global context has not been initialised with global values');
                return res;
            }

            return res.node.interpret(env);
        },
    };
}