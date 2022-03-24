import { Lexer } from "./parse/lexer";
import { Parser } from "./parse/parser";
import {
    compileConfig,
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
import Position from "./position";
import { compileResult, interpretResult, Node } from "./runtime/nodes";
import { ESArray, initPrimitiveTypes } from "./runtime/primitiveTypes";
import { dict, timeData } from "./util/util";
import { Context } from "./runtime/context";
import addNodeBIFs from "./built-in/nodeLibs";
import colours from './util/colours';

// @ts-ignore
import JS_STD_TXT_RAW from 'raw-loader!./built-in/compiledSTD/std.txt.js';

// @ts-ignore
import PY_STD_TXT_RAW from 'raw-loader!./built-in/compiledSTD/std.txt.py';
import { preloadModules } from "./built-in/builtInModules";
import { config } from "./config";
import { NativeObj } from "./runtime/primitives/primitive";

export {
    Context,
    colours,
    Position,
};

export * from './runtime/primitiveTypes';
export {
    VERSION,
    global, setGlobalContext,
    IS_NODE_INSTANCE, runningInNode,
    compileConfig,
    libs,
    now, refreshPerformanceNow,
    configFileName
} from './constants';
export * from './errors';
export * from './runtime/nodes';
export * from './util/util';
export {strip, wrap} from './runtime/primitives/wrapStrip';
export {ESSymbol} from './runtime/symbol';
export {parseConfig, config} from './config';

/**
 * @param {(...args: any) => void} print
 * @param {(msg: string, cb: (...arg: any[]) => any) => void} input
 * @param {boolean} node is this running in node or not. Assumed based on existence of 'window' object
 * @param {Context} context
 * @param {string} path
 * @param libs
 * @returns {Promise<Context | ESError>} error or the global context
 */
export async function init ({
    print = console.log,
    input = () => {},
    node = true,
    context = new Context(),
    path = '',
    libs = {}
}: {
    print?: (...args: any[]) => void,
    input?: (msg: string, cb: (...arg: any[]) => any) => void,
    node?: boolean,
    context?: Context,
    path?: string,
    libs?: dict<[NativeObj, boolean]>
} = {}): Promise<ESError | Context> {

    setGlobalContext(context);

    initPrimitiveTypes();

    const res = initialise(context, print, input, libs);
    if (res instanceof ESError) {
        return res;
    }

    if (path) {
        context.path = path;
    }

    if (node) {
        runningInNode();
        await refreshPerformanceNow(true);
        addNodeBIFs(context);
    }

    let modulePreloadRes = await preloadModules(config.modules);
    if (modulePreloadRes instanceof ESError) {
        return modulePreloadRes;
    }

    return global;
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