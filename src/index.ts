import { Lexer } from "./parse/lexer";
import { Parser } from "./parse/parser";
import {
    ICompileConfig,
    GLOBAL_CTX,
    now,
    refreshPerformanceNow,
    runningInNode,
    setGlobalContext,
    VERSION
} from "./util/constants";
import { Error } from "./errors";
import Position from "./position";
import { CompileResult, InterpretResult, Node } from "./runtime/nodes";
import { ESArray } from "./runtime/primitiveTypes";
import type { ITimeData } from "./util/util";
import { Context } from "./runtime/context";
import colours from './util/colours';
import {wrap} from "./runtime/wrapStrip";

// @ts-ignore
import JS_STD_TXT_RAW from 'raw-loader!./built-in/compiledSTD/std.txt';
// @ts-ignore
import PY_STD_TXT_RAW from 'raw-loader!./built-in/compiledSTD/std.txt.py';

import { config } from "./config";

export * from './runtime/primitiveTypes';
export {
    IS_NODE_INSTANCE,
    libs,
    CONFIG_FILE_NAME
} from './util/constants';
export * from './errors';
export * from './runtime/nodes';
export * from './util/util';
export {strip, wrap} from './runtime/wrapStrip';
export {ESSymbol} from './runtime/symbol';
export {parseConfig} from './config';
import init from './init';

export {
    init,
    VERSION,
    GLOBAL_CTX as global, setGlobalContext,
    now, refreshPerformanceNow,
    ICompileConfig,
    runningInNode,
    config,
    Context,
    colours,
    Position,
};

export interface IRunConfig {
    env?: Context,
    measurePerformance?: boolean,
    fileName?: string,
    currentDir?: string,
    compileToJS?: boolean,
    compileJSConfig?: ICompileConfig,
}

function runViaCompilation (msg: string, fileName: string, currentDir: string, compileJSConfig: ICompileConfig): InterpretResult {
    const { compileToJavaScript, error } = parse(msg, { fileName, currentDir });
    if (error) {
        const res_ = new InterpretResult();
        res_.error = error;
        return res_;
    }
    const js = compileToJavaScript(compileJSConfig);
    if (js.error) {
        const res_ = new InterpretResult();
        res_.error = js.error;
        return res_;
    }
    console.log('-----------------');
    console.log(js.val);
    console.log('-----------------');

    const executor = new Function(`${js.val}`);
    let result: any;
    try {
        result = executor.call({});
    } catch (e: any) {
        const res_ = new InterpretResult();
        res_.error = new Error(e.name, e.stack);
        return res_;
    }
    const res_ = new InterpretResult();
    res_.val = wrap(result);
    console.log(result);
    return res_;
}

/**
 * Runs the given code in the given environment.
 */
export function run (msg: string, {
    env = GLOBAL_CTX,
    measurePerformance = false,
    fileName = '(unknown)',
    currentDir='',
    compileToJS = false,
    compileJSConfig = {
        minify: false,
        symbols: [],
        indent: 0
    },
}: IRunConfig = {}): { timeData?: ITimeData } & InterpretResult {

    if (compileToJS) {
        return runViaCompilation(msg, fileName, currentDir, compileJSConfig);
    }

    if (currentDir) {
        env.path = currentDir;
    }

    Node.maxTime = 0;
    Node.totalTime = 0;
    Node.interprets = 0;

    const timeData: ITimeData = {
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

    if (!env.root.initialisedAsGlobal) {
        const res = new InterpretResult();
        res.error = new Error(
            'UninitialisedError',
            'Global context has not been initialised with global values'
        );
        return res;
    }

    const lexer = new Lexer(msg, fileName);
    const lexerRes = lexer.generate();
    if (lexerRes instanceof Error) {
        const res_ = new InterpretResult();
        res_.error = lexerRes;
        return res_;
    }
    timeData.lexerTotal = now() - start;
    start = now();

    const parser = new Parser(lexerRes);
    const res = parser.parse();
    if (res.error) {
        const res_ = new InterpretResult();
        res_.error = res.error;
        return res_;
    }
    timeData.parserTotal = now() - start;
    start = now();

    if (!res.node) {
        const res = new InterpretResult();
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

    return { ...finalRes, timeData };
}

export function parse (code: string, {
    fileName = '(unknown)',
    currentDir=''
} = {}) {

    const lexer = new Lexer(code, fileName);
    const lexerRes = lexer.generate();
    if (lexerRes instanceof Error) {
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
            error: new Error('Error', 'no output')
        };
    }

    return {
        compileToJavaScript: (config: ICompileConfig): CompileResult => {
            if (!res.node) throw 'res.node still undefined';
            const comment = `// Generated by EntropyScript->JavaScript compiler v${VERSION}\n`;
            const stdStr = JS_STD_TXT_RAW.toString().replace(/(\r\n|\n|\r|\t| )+/gm, ' ') + '\n';
            const out = res.node.compileJS(config);
            if (out.error) return out;
            if (config.minify) {
                out.val = out.val.replace(/(\r\n|\n|\r|\t| )+/gm, ' ');
            }
            return new CompileResult(comment + stdStr + out.val);
        },

        compileToPython: (config: ICompileConfig): CompileResult => {
            if (!res.node) throw 'res.node still undefined';
            const comment = `# Generated by EntropyScript->Python compiler v${VERSION}\n\n`;
            const stdStr = PY_STD_TXT_RAW.toString() + '\n';
            const out = res.node.compilePy(config);
            if (out.error) return out;
            return new CompileResult(comment + stdStr + out.hoisted + '\n' + out.val);
        },

        interpret: (env=GLOBAL_CTX): InterpretResult => {
            if (!res.node) throw 'res.node still undefined';

            if (currentDir) {
                env.path = currentDir;
            }

            if (!env.root.initialisedAsGlobal){
                const res = new InterpretResult();
                res.error = new Error('Uninitialised',
                    'Global context has not been initialised with global values');
                return res;
            }

            return res.node.interpret(env);
        }
    };
}

export { str } from "./util/util";