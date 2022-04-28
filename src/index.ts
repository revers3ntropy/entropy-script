import { Lexer } from "./parse/lexer";
import { Parser } from "./parse/parser";
import {
    GLOBAL_CTX,
    ICompileConfig,
    now,
    refreshPerformanceNow,
    runningInNode,
    setGlobalContext,
    VERSION
} from "./util/constants";
import { Error } from "./errors";
import Position from "./position";
import { InterpretResult } from "./runtime/nodes";
import { ESArray } from "./runtime/primitiveTypes";
import { Context } from "./runtime/context";
import colours from './util/colours';

import { Config } from "./config";
import init from './init';

export * from './runtime/primitiveTypes';
export {
    IS_NODE_INSTANCE,
    libs,
    CONFIG_FILE_NAME
} from './util/constants';
export * from './errors';
export * from './runtime/nodes';
export * from './util/util';
export { strip, wrap } from './runtime/wrapStrip';
export { ESSymbol } from './runtime/symbol';
export { parseConfig } from './config';

export {
    init,
    VERSION,
    GLOBAL_CTX as global, setGlobalContext,
    now, refreshPerformanceNow,
    ICompileConfig,
    runningInNode,
    Config,
    Context,
    colours,
    Position
};

/**
 * Runs arbitrary code.
 * Returns an InterpretResult, which holds an error and a value
 * @param {string} msg
 * @param {Context} env
 * @param {boolean} measurePerformance
 * @param {string} fileName
 * @param {string} currentDir
 * @returns {InterpretResult}
 */
export function run (msg: string, {
    env = GLOBAL_CTX,
    fileName = '(unknown)',
    currentDir=''
} = {}): InterpretResult {

    if (currentDir) {
        env.path = currentDir;
    }

    if (!env.root.initialisedAsGlobal){
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

    const parser = new Parser(lexerRes);
    const res = parser.parse();
    if (res.error) {
        const res_ = new InterpretResult();
        res_.error = res.error;
        return res_;
    }


    if (!res.node) {
        const res = new InterpretResult();
        res.val = new ESArray([]);
        return res;
    }

    return res.node.interpret(env);
}