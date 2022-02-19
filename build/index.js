var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import './util/colourString.js';
import { Lexer } from "./tokenise/lexer.js";
import { Parser } from "./parse/parser.js";
import { global, now, refreshPerformanceNow, runningInNode, setGlobalContext } from "./constants.js";
import { initialise } from "./init.js";
import { ESError } from "./errors.js";
import { Position } from "./position.js";
import { interpretResult, Node } from "./runtime/nodes.js";
import { ESArray } from "./runtime/primitiveTypes.js";
import { Context } from "./runtime/context.js";
import addNodeLibs from "./built-in/nodeLibs.js";
import { libs as allLibs } from './constants.js';
export { Context, };
export function init(printFunc = console.log, inputFunc, node = true, libs = { print: console.log }, context = new Context(), path = '') {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const res = initialise(context, printFunc, inputFunc);
        if (res instanceof ESError) {
            return res;
        }
        setGlobalContext(context);
        (_a = libs['context']) !== null && _a !== void 0 ? _a : (libs['context'] = context);
        if (path) {
            context.path = path;
        }
        if (libs.print) {
            allLibs.print = libs.print;
        }
        if (node) {
            runningInNode();
            yield refreshPerformanceNow(true);
            addNodeLibs(libs, context);
        }
    });
}
export function run(msg, { env = global, measurePerformance = false, fileName = '(unknown)', currentDir = '' } = {}) {
    if (currentDir) {
        env.path = currentDir;
    }
    Node.maxTime = 0;
    Node.totalTime = 0;
    Node.interprets = 0;
    const timeData = {
        total: 0,
        lexerTotal: 0,
        parserTotal: 0,
        interpretTotal: 0,
        nodeMax: 0,
        nodeAvg: 0,
        nodeTotal: 0,
        interprets: 0,
    };
    let start = now();
    if (!env.root.initialisedAsGlobal) {
        const res = new interpretResult();
        res.error = new ESError(Position.unknown, 'Uninitialised', 'Global context has not been initialised with global values');
        return res;
    }
    const lexer = new Lexer(msg, fileName);
    const [tokens, error] = lexer.generate();
    if (error) {
        const res_ = new interpretResult();
        res_.error = error;
        return res_;
    }
    timeData.lexerTotal = now() - start;
    start = now();
    const parser = new Parser(tokens);
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
    return Object.assign(Object.assign({}, finalRes), { timeData });
}
