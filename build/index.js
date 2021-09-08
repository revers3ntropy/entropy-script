import { Lexer } from "./lexer.js";
import { Parser } from "./parser.js";
import { global, globalConstants, now } from "./constants.js";
import { initialise } from "./init.js";
import { ESError } from "./errors.js";
import { Position } from "./position.js";
import { interpretResult } from "./nodes.js";
import { Node } from "./nodes.js";
export function init(printFunc = console.log, inputFunc, libs) {
    initialise(global, printFunc, inputFunc, libs);
}
export function run(msg, { env = global, measurePerformance = false } = {}) {
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
    const start = now();
    globalConstants.timer.start();
    if (!env.root.initialisedAsGlobal) {
        const res = new interpretResult();
        res.error = new ESError(Position.unknown, Position.unknown, 'Uninitialised', 'Global context has not been initialised with global values');
        return res;
    }
    const lexer = new Lexer(msg);
    const [tokens, error] = lexer.generate();
    if (error) {
        const res_ = new interpretResult();
        res_.error = error;
        return res_;
    }
    timeData.lexerTotal = globalConstants.timer.get();
    globalConstants.timer.reset();
    const parser = new Parser(tokens);
    const res = parser.parse();
    if (res.error) {
        const res_ = new interpretResult();
        res_.error = res.error;
        return res_;
    }
    timeData.parserTotal = globalConstants.timer.get();
    globalConstants.timer.reset();
    if (!res.node) {
        const res = new interpretResult();
        res.val = [];
        return res;
    }
    const finalRes = res.node.interpret(env);
    timeData.interpretTotal = globalConstants.timer.get();
    timeData.total = now() - start;
    timeData.nodeMax = Node.maxTime;
    timeData.nodeTotal = Node.totalTime;
    timeData.nodeAvg = Node.totalTime / Node.interprets;
    timeData.interprets = Node.interprets;
    if (measurePerformance)
        console.log(timeData);
    return Object.assign(Object.assign({}, finalRes), { timeData });
}
