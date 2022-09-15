import { Token } from "../parse/tokens";
import { EndIterator, Error, InvalidSyntaxError, ReferenceError, TypeError } from "../errors";
import { Context } from './context';
import Position from "../position";
import { CATCH_BLOCK_ERR_SYMBOL_ID, ICompileConfig, now, tt, ttAsStr, types } from "../util/constants";
import { interpretArgument, IRuntimeArgument, IUninterpretedArgument } from "./argument";
import { wrap } from './wrapStrip';
import {
    ESArray,
    ESBoolean,
    ESErrorPrimitive,
    ESFunction, ESJSBinding,
    ESNamespace,
    ESNumber,
    ESObject,
    ESPrimitive,
    ESString,
    ESType,
    ESNull,
    Primitive
} from "./primitiveTypes";
import { Map, generateRandomSymbol, str } from '../util/util';
import { ESTypeNot, ESTypeUnion } from "./primitives/type";

export class InterpretResult {
    val: Primitive = new ESNull();
    error: Error | undefined;
    funcReturn: Primitive | undefined;
    shouldBreak = false;
    shouldContinue = false;

    constructor (val?: Primitive | Error) {
        if (val instanceof Error) {
            this.error = val;
        } else if (val) {
            this.val = val;
        }
    }
}

export class CompileResult {
    val = '';
    // for hoisting declarations to the start of the file, gets added after STD
    hoisted = '';
    error: Error | undefined;

    constructor (val?: string | Error) {
        if (typeof val === 'string') {
            this.val = val;
        } else if (val) {
            this.error = val;
        }
    }

    register (node: Node, config: ICompileConfig): string {
        const res = node.compilePy(config);
        this.hoisted += res.hoisted;
        if (res.error) {
            this.error = res.error;
            return '';
        }
        return res.val;
    }
}

export abstract class Node {
    pos: Position;
    isTerminal;

    static interprets = 0;
    static totalTime = 0;
    static maxTime = 0;

    protected constructor (pos: Position, isTerminal=false) {
        this.pos = pos;
        this.isTerminal = isTerminal;
    }

    abstract interpret_ (context: Context): Error | InterpretResult;

    interpret (context: Context): InterpretResult {
        const start = now();
        const res = new InterpretResult;
        const val = this.interpret_(context);

        if (val instanceof Error) {
            res.error = val;

        } else if (val instanceof InterpretResult) {
            res.val = val.val;
            res.error = val.error;
            res.funcReturn = val.funcReturn;
            res.shouldBreak = val.shouldBreak;
            res.shouldContinue = val.shouldContinue;

        } else {
            res.val = val;
        }

        if (res.error && res.error.pos.isUnknown) {
            res.error.pos = this.pos;
        }

        if (!(res.val instanceof ESPrimitive)) {
            res.error = new TypeError('Primitive',
                'Native JS value', str(res.val));
            res.val = new ESNull();
        }

        res.val.__info__.file ||= this.pos.file;

        Node.interprets++;
        const time = now() - start;
        Node.totalTime += time;
        if (time > Node.maxTime) Node.maxTime = time;

        return res;
    }

    abstract compileJS (config: ICompileConfig): CompileResult;
    abstract compilePy (config: ICompileConfig): CompileResult;

    abstract str(): string;
}

// --- NON-TERMINAL NODES ---

export class N_binOp extends Node {
    left: Node;
    right: Node;
    opTok: Token;

    constructor (pos: Position, left: Node, opTok: Token, right: Node) {
        super(pos);
        this.left = left;
        this.opTok = opTok;
        this.right = right;
    }

     interpret_(context: Context): Error | InterpretResult {
        const left = this.left.interpret(context);
        if (left.error) return left.error;
        const right = this.right.interpret(context);
        if (right.error) return right.error;

        const l = left.val;
        const r = right.val;
        if (typeof l === 'undefined') {
            return new TypeError('~nil', 'nil', l, 'N_binOp.interpret_')
                .position(this.opTok.pos);
        }

        if (typeof r === 'undefined') {
            return new TypeError('~nil', 'nil', r, 'N_binOp.interpret_')
                .position(this.opTok.pos);
        }

        switch (this.opTok.type) {
            case tt.LTE: {
                const lt = l.__lt__({context}, r);
                const eq = l.__eq__({context}, r);
                if (lt instanceof Error) return lt;
                if (eq instanceof Error) return eq;
                return new InterpretResult(lt.__or__({context}, eq));

            } case tt.GTE: {
                const gt = l.__gt__({context}, r);
                const eq = l.__eq__({context}, r);
                if (gt instanceof Error) return gt;
                if (eq instanceof Error) return eq;
                return new InterpretResult(gt.__or__({context}, eq));

            } case tt.NOT_EQUALS: {
                const res = l.__eq__({context}, r);
                if (res instanceof Error) return res;
                return new InterpretResult(new ESBoolean(!res.bool().__value__));

            } case tt.ADD:
                return new InterpretResult(l.__add__({context}, r));
            case tt.SUB:
                return new InterpretResult(l.__subtract__({context}, r));
            case tt.ASTRIX:
                return new InterpretResult(l.__multiply__({context}, r));
            case tt.DIV:
                return new InterpretResult(l.__divide__({context}, r));
            case tt.POW:
                return new InterpretResult(l.__pow__({context}, r));
            case tt.MOD:
                return new InterpretResult(l.__mod__({context}, r));
            case tt.EQUALS:
                return new InterpretResult(l.__eq__({context}, r));
            case tt.LT:
                return new InterpretResult(l.__lt__({context}, r));
            case tt.GT:
                return new InterpretResult(l.__gt__({context}, r));
            case tt.AND:
                return new InterpretResult(l.__and__({context}, r));
            case tt.OR:
                return new InterpretResult(l.__or__({context}, r));
            case tt.AMPERSAND:
                return new InterpretResult(l.__ampersand__({context}, r));
            case tt.PIPE:
                return new InterpretResult(l.__pipe__({context}, r));
            case tt.DOUBLE_QM:
                return new InterpretResult(l.__nilish__({context}, r));

            case tt.IDENTIFIER:
                if (this.opTok.value === 'in') {
                    if (!r.__iterable__ || !('contains' in r)) {
                        return new TypeError('Iterable', r.__type_name__(), str(r));
                    }
                    return new InterpretResult(r.contains({context}, l));
                }

            // eslint-disable-next-line no-fallthrough
            default:
                return new InvalidSyntaxError(
                    `Invalid binary operator: ${this.opTok.str()}`
                ).position(this.opTok.pos);
        }
    }

    compileJS (config: ICompileConfig) {
        const left = this.left.compileJS(config);
        if (left.error) return left;
        const right = this.right.compileJS(config);
        if (right.error) return right;

        if (config.minify) {
            return new CompileResult(`${left.val}${this.opTok.str()}${right.val}`);
        }
        return new CompileResult(`${left.val} ${this.opTok.str()} ${right.val}`);
    }

    compilePy (config: ICompileConfig): CompileResult {
        const left = this.left.compilePy(config);
        if (left.error) return left;
        const right = this.right.compilePy(config);
        if (right.error) return right;

        const switchers: Map<string> = {
            '&&': 'and',
            '||': 'or',
            '^': '**',
        };

        let op = ttAsStr[this.opTok.type];
        if (op in switchers) {
            op = switchers[op];
        }

        return new CompileResult(`${left.val} ${op} ${right.val}`);
    }

    str () {
        return `(${this.left.str()} ${this.opTok.str()} ${this.right.str()})`;
    }
}

export class N_unaryOp extends Node {
    a: Node;
    opTok: Token;

    constructor (pos: Position, a: Node, opTok: Token) {
        super(pos);
        this.a = a;
        this.opTok = opTok;
    }

    interpret_(context: Context): Error | InterpretResult {
        const res = this.a.interpret(context);
        if (res.error) return res.error;

        switch (this.opTok.type) {
            case tt.SUB:
            case tt.ADD:
                if (!(res.val instanceof ESNumber)) {
                    return new TypeError(
                        'ESNumber',
                        res.val?.__type_name__().toString() || 'undefined_',
                        res.val?.__value__
                    ).position(this.pos);
                }
                const numVal = res.val.__value__;
                return new InterpretResult(new ESNumber(
                    this.opTok.type === tt.SUB ? -numVal : Math.abs(numVal)));
            case tt.NOT:
                return new InterpretResult(new ESBoolean(!res?.val?.bool({context}).__value__));
            case tt.BITWISE_NOT:
                return new InterpretResult(new ESTypeNot(res.val));
            case tt.QM:
                return new InterpretResult(new ESTypeUnion(types.undefined, res.val));

            default:
                return new InvalidSyntaxError(
                    `Invalid unary operator: ${this.opTok.str()}`
                ).position(this.opTok.pos);
        }
    }

    compileJS (config: ICompileConfig) {
        const val = this.a.compileJS(config);
        if (val.error) return val;

        return new CompileResult(`${this.opTok.str()}${val.val}`);
    }

    compilePy (config: ICompileConfig) {
        const val = this.a.compilePy(config);
        if (val.error) return val;

        return new CompileResult(`${this.opTok.str()}${val.val}`);
    }

    str () {
        return `(${this.opTok.str()}${this.a.str()})`;
    }
}

export class N_varAssign extends Node {
    value: Node;
    varNameTok: Token<string>;
    isGlobal: boolean;
    isConstant: boolean;
    isDeclaration: boolean;
    assignType: string;
    type: Node;

    constructor (
        pos: Position,
        varNameTok: Token<string>,
        value: Node,
        assignType='=',
        isGlobal=false,
        isConstant=false,
        isDeclaration=false,
        type: Primitive | Node = types.any
    ) {
        super(pos);
        this.value = value;
        this.varNameTok = varNameTok;
        this.isGlobal = isGlobal;
        this.assignType = assignType;
        this.isConstant = isConstant;
        this.isDeclaration = isDeclaration;

        if (type instanceof ESPrimitive) {
            // wrap raw ESType in node
            this.type = new N_primitiveWrapper(type);
        } else {
            this.type = type;
        }
    }

    interpret_(context: Context): InterpretResult | Error {

        if (this.isDeclaration) {
            if (context.hasOwn(this.varNameTok.value)) {
                return new InvalidSyntaxError(
                    `Symbol '${ this.varNameTok.value }' already exists, and cannot be redeclared`)
                    .position(this.pos);
            }

            if (this.assignType !== '=') {
                return new InvalidSyntaxError(
                    `Cannot declare variable with operator '${this.assignType}'`)
                    .position(this.pos);
            }
        }

        const res = this.value.interpret(context);
        const typeRes = this.type.interpret(context);

        if (res.error) return res.error;
        if (typeRes.error) return typeRes.error;

        if (!typeRes.val) {
            return new TypeError(
                'Type',
                'nil'
            ).position(this.varNameTok.pos);
        }

        if (!res.val) {
            return new TypeError(
                '~nil',
                'nil',
                'N_varAssign.interpret_'
            ).position(this.varNameTok.pos);
        }

        const typeCheckRes = typeRes.val.__includes__({context}, res.val);
        if (typeCheckRes instanceof Error) return typeCheckRes;

        if (!typeCheckRes.bool().__value__) {
            return new TypeError(
                str(typeRes.val),
                str(res.val?.__type_name__()),
                str(res.val)
            ).position(this.varNameTok.pos);
        }


        if (this.isDeclaration) {
            context.setOwn(this.varNameTok.value, res.val, {
                global: false,
                isConstant: this.isConstant,
                type: typeRes.val
            });
            return new InterpretResult(res.val);
        }

        if (context.has(this.varNameTok.value)) {
            const symbol = context.getSymbol(this.varNameTok.value);
            if (symbol instanceof Error) {
                return symbol;
            }
            if (symbol) {
                const typeCheckRes = symbol.type.__includes__({context}, res.val);
                if (typeCheckRes instanceof Error) return typeCheckRes;
                if (!typeCheckRes.__value__) {
                    return new TypeError(
                        str(symbol.type),
                        res.val?.__type_name__(),
                        str(res.val)
                    ).position(this.varNameTok.pos);
                }
            }
        }

        if (this.assignType === '=') {
            // simple assign
            let value = res.val;
            if (value === undefined) {
                value = new ESNull();
            }

            const type = context.getSymbol(this.varNameTok.value);

            if (type instanceof Error) {
                return type;
            }
            if (!type) {
                return new InvalidSyntaxError(`Cannot declare variable without keyword`)
                    .position(this.pos);
            }

            const typeCheckRes = type.type.__includes__({context}, res.val);

            if (typeCheckRes instanceof Error) return typeCheckRes;

            if (!typeCheckRes.bool().__value__) {
                return new TypeError(str(type.type), str(res.val.__type__), str(res.val));
            }

            const setRes = context.set(this.varNameTok.value, value, {
                global: this.isGlobal,
                isConstant: this.isConstant,
                type: type.type
            });

            if (setRes instanceof Error) {
                return setRes;
            }

        } else {

            // assign with modifier like *= or -=
            const currentVal = context.get(this.varNameTok.value);
            if (currentVal instanceof Error) return currentVal;

            if (currentVal == undefined)
                return new InvalidSyntaxError(
                    `Cannot declare variable with operator '${this.assignType}'`)
                    .position(this.pos);

            let newVal: Primitive | Error;
            const assignVal = res.val;

            switch (this.assignType[0]) {
                case '*':
                    newVal = currentVal.__multiply__({context}, assignVal); break;
                case '/':
                    newVal = currentVal.__divide__({context}, assignVal); break;
                case '+':
                    newVal = currentVal.__add__({context}, assignVal); break;
                case '-':
                    newVal = currentVal.__subtract__({context}, assignVal); break;

                default:
                    return new Error(
                        'AssignError',
                        `Cannot find assignType of ${this.assignType[0]}`
                    ).position(this.pos);
            }

            if (newVal instanceof Error) {
                return newVal;
            }

            const setRes = context.set(this.varNameTok.value, newVal, {
                global: this.isGlobal,
                isConstant: this.isConstant,
                type: newVal.__type__
            });

            if (setRes instanceof Error) return setRes;
            res.val = newVal;
        }

        if (res.val.__info__.name === '(anonymous)' || !res.val.__info__.name) {
            res.val.__info__.name = this.varNameTok.value;
        }

        return res;
    }

    compileJS (config: ICompileConfig) {
        const val = this.value.compileJS(config);
        if (val.error) return val;

        let declaration = '';

        if (this.isDeclaration) {
            if (this.isGlobal) {
                declaration = 'var';
            } else if (this.isConstant) {
                declaration = 'const';
            } else {
                declaration = 'let';
            }
        }

        let assign = this.assignType;
        if (assign !== '=') {
            assign += '=';
        }
        if (config.minify) {
            return new CompileResult(`${declaration} ${this.varNameTok.value}${assign}${val.val}`);
        }
        return new CompileResult(`${declaration} ${this.varNameTok.value} ${assign} ${val.val}`);
    }

    compilePy (config: ICompileConfig) {
        const res = new CompileResult

        const val = this.value.compilePy(config);
        if (val.error) return val;
        res.hoisted += val.hoisted;

        let assign = this.assignType;
        if (assign !== '=') {
            assign += '=';
        }


        // if it is global, then define it at the top
        if (this.isGlobal) {
            res.hoisted += `${this.varNameTok.value}=None`;
        }

        if (config.minify) {
            res.val = `${this.varNameTok.value}${assign}${val.val}`;
        } else {
            res.val = `${this.varNameTok.value} ${assign} ${val.val}`;
        }

        return res;
    }

    str () {
        let assign = this.assignType;
        if (assign !== '=') {
            assign += '=';
        }
        return `(let ${this.varNameTok.value} ${assign} ${this.value.str()})`;
    }
}

export class N_destructAssign extends Node {
    value: Node;
    varNames: string[];
    types: Node[];
    isGlobal: boolean;
    isConstant: boolean;

    constructor (
        pos: Position,
        varNames: string[],
        types: Node[],
        value: Node,
        isGlobal=false,
        isConstant=false,
    ) {
        super(pos);
        this.value = value;
        this.varNames = varNames;
        this.types = types;
        this.isGlobal = isGlobal;
        this.isConstant = isConstant;
    }

    interpret_(context: Context): InterpretResult | Error {

        for (const varName of this.varNames) {
            if (context.hasOwn(varName)) {
                return new InvalidSyntaxError(
                    `Symbol '${varName}' already exists, and cannot be redeclared`)
                    .position(this.pos);
            }
        }

        const res = this.value.interpret(context);
        if (res.error) return res.error;

        if (res.val.__type__ === types.object) {
            let i = 0;
            for (const varName of this.varNames) {
                const objPropRes =  res.val.__get__({context}, new ESString(varName));
                if (objPropRes instanceof Error) return objPropRes;

                const typeRes = this.types[i].interpret(context);
                if (typeRes.error) return typeRes;

                const typeCheckRes = typeRes.val.__includes__({context}, objPropRes);
                if (typeCheckRes instanceof Error) return typeCheckRes;

                if (!typeCheckRes.bool().__value__) {
                    return new TypeError(str(typeRes.val), objPropRes.__type_name__(), str(objPropRes));
                }

                context.setOwn(varName, objPropRes, {
                    global: this.isGlobal,
                    isConstant: this.isConstant,
                    type: res.val.__type__
                });
                i++;
            }

            return new InterpretResult(res.val);
        }

        if (!res.val.__iterable__) {
            return new Error('TypeError', 'Expected iterable in destructure assignment');
        }


        const iterable = res.val.__iter__({context});

        if (iterable instanceof Error) return iterable;

        let i = 0;
        for (const varName of this.varNames) {
            const nextRes = iterable.__next__({context});

            if (nextRes instanceof ESErrorPrimitive && nextRes.__value__ instanceof EndIterator) {
                return new Error('IndexError', 'Iterator ended unexpectedly - not enough elements to destruct');
            }
            // for doing strings
            if (nextRes instanceof Error) {
                return nextRes;
            }

            const typeRes = this.types[i].interpret(context);
            if (typeRes.error) return typeRes;

            const typeCheckRes = typeRes.val.__includes__({context}, nextRes);
            if (typeCheckRes instanceof Error) return typeCheckRes;

            if (!typeCheckRes.bool().__value__) {
                return new TypeError(str(typeRes.val), nextRes.__type_name__(), str(nextRes));
            }

            context.setOwn(varName, nextRes, {
                global: this.isGlobal,
                isConstant: this.isConstant,
                type: res.val.__type__
            });
            i++;
        }

        return new InterpretResult(res.val);
    }

    compileJS (config: ICompileConfig) {
        const val = this.value.compileJS(config);
        if (val.error) return val;

        let declaration;

        if (this.isGlobal) {
            declaration = 'var';
        } else if (this.isConstant) {
            declaration = 'const';
        } else {
            declaration = 'let';
        }

        if (config.minify) {
            return new CompileResult(`${declaration}[${this.varNames.join(',')}]=${val.val}`);
        }
        return new CompileResult(`${declaration} [${this.varNames.join(', ')}] = ${val.val}`);
    }

    compilePy (config: ICompileConfig) {
        const val = this.value.compileJS(config);
        if (val.error) return val;

        return new CompileResult(`${this.varNames.join(', ')} = ${val.val}`);
    }

    str () {
        return `(${this.varNames.join(', ')} = ${this.value.str()})`;
    }
}

export class N_if extends Node {
    comparison: Node;
    ifTrue: Node;
    ifFalse: Node | undefined;

    constructor (pos: Position, comparison: Node, ifTrue: Node, ifFalse: Node | undefined) {
        super(pos);
        this.comparison = comparison;
        this.ifFalse = ifFalse;
        this.ifTrue = ifTrue;
    }

    interpret_(context: Context): InterpretResult {
        const newContext = new Context();
        newContext.parent = context;
        let res: InterpretResult = new InterpretResult();

        const compRes = this.comparison.interpret(context);
        if (compRes.error) return compRes;

        if (compRes.val?.bool({ context }).__value__) {
            res = this.ifTrue.interpret(newContext);

        } else if (this.ifFalse) {
            res = this.ifFalse.interpret(newContext);
        }

        newContext.clear();

        res.val = new ESNull();
        return res;
    }

    compileJS (config: ICompileConfig) {
        const indent = ' '.repeat(config.indent);
        const highIndent = ' '.repeat(config.indent+4);

        config.indent += 4;

        const statementRes = this.comparison.compileJS(config);
        if (statementRes.error) return statementRes;

        const ifTrueRes = this.ifTrue.compileJS(config);
        if (ifTrueRes.error) return ifTrueRes;

        if (!this.ifFalse) {
            if (config.minify) {
                return new CompileResult(`if(${statementRes.val}){${ifTrueRes.val}\n}`);
            }
            return new CompileResult(`if (${statementRes.val}) {\n${ifTrueRes.val}\n}`);
        }

        config.indent = highIndent.length;

        const ifFalseRes = this.ifFalse.compileJS(config);
        if (ifFalseRes.error) return ifFalseRes;

        if (!(this.ifFalse instanceof N_statements)) {
            ifFalseRes.val = highIndent + ifFalseRes.val;
        }

        if (config.minify) {
            return new CompileResult(`if(${statementRes.val}){${ifTrueRes.val}}else{${ifFalseRes.val}}`);
        }

        return new CompileResult(
            `if (${statementRes.val}) {\n${ifTrueRes.val}\n${indent}} else {\n${ifFalseRes.val}\n${indent}}`);
    }

    compilePy (config: ICompileConfig) {
        const res = new CompileResult;

        const indent = ' '.repeat(config.indent);
        const highIndent = ' '.repeat(config.indent+4);

        config.indent += 4;

        const statementRes = this.comparison.compilePy(config);
        if (statementRes.error) return statementRes;
        res.hoisted += statementRes.hoisted;

        const ifTrueRes = this.ifTrue.compilePy(config);
        if (ifTrueRes.error) return ifTrueRes;
        res.hoisted += ifTrueRes.hoisted;

        if (!this.ifFalse) {
            return new CompileResult(`if ${statementRes.val}:\n${highIndent}${ifTrueRes.val}`);
        }

        const ifFalseRes = this.ifFalse.compilePy(config);
        if (ifFalseRes.error) return ifFalseRes;
        res.hoisted += ifFalseRes.hoisted;

        if (!(this.ifFalse instanceof N_statements)) {
            ifFalseRes.val = highIndent + ifFalseRes.val;
        }

        return new CompileResult(
            `if ${statementRes.val}:\n${ifTrueRes.val}\n${indent}else:\n${ifFalseRes.val}\n${indent}`);
    }

    str () {
        return `(if ${this.comparison.str()}{${this.ifTrue.str()}} else {${this.ifFalse?.str()})`
    }
}

export class N_while extends Node {
    comparison: Node;
    loop: Node;

    constructor (pos: Position, comparison: Node, loop: Node) {
        super(pos);
        this.comparison = comparison;
        this.loop = loop;
    }

    interpret_(context: Context): Error | InterpretResult {
        while (true) {
            const newContext = new Context();
            newContext.parent = context;

            const shouldLoop = this.comparison.interpret(context);
            if (shouldLoop.error) return shouldLoop;

            if (!shouldLoop.val?.bool({context})?.__value__) {
                break;
            }

            const potentialError = this.loop.interpret(newContext)
            if (potentialError.error) {
                return potentialError;
            }
            if (potentialError.shouldBreak) {
                break;
            }
        }
        return new InterpretResult(new ESNull());
    }

    compileJS (config: ICompileConfig) {

        config.indent += 4;

        const comparisonRes = this.comparison.compileJS(config);
        if (comparisonRes.error) return comparisonRes;

        const bodyRes = this.loop.compileJS(config);
        if (bodyRes.error) return bodyRes;

        if (config.minify) {
            return new CompileResult(`while(${comparisonRes.val}){${bodyRes.val}}`);
        }
        return new CompileResult(`while (${comparisonRes.val}) {\n${bodyRes.val}}`);
    }

    compilePy (config: ICompileConfig) {
        const res = new CompileResult;

        const highIndent = ' '.repeat(config.indent || 0);

        const comparisonRes = this.comparison.compilePy(config);
        if (comparisonRes.error) return comparisonRes;
        res.hoisted += comparisonRes.hoisted;

        const bodyRes = this.loop.compilePy(config);
        if (bodyRes.error) return bodyRes;
        res.hoisted += bodyRes.hoisted;

        return new CompileResult(`while ${comparisonRes.val}:\n${highIndent}${bodyRes.val}`);
    }

    str () {
        return '(while)';
    }
}

export class N_for extends Node {
    array: Node;
    body: Node;
    identifier: Token<string>;
    isGlobalId: boolean;
    isConstId: boolean;

    constructor (pos: Position, body: Node, array: Node, identifier: Token<string>, isGlobalIdentifier: boolean, isConstIdentifier: boolean) {
        super(pos);
        this.body = body;
        this.array = array;
        this.identifier = identifier;
        this.isGlobalId = isGlobalIdentifier;
        this.isConstId = isConstIdentifier;
    }

    interpret_ (context: Context): Error | InterpretResult {
        const array = this.array.interpret(context);
        if (array.error) return array;

        if (context.has(this.identifier.value) && this.isGlobalId) {
            return new InvalidSyntaxError('Cannot declare global variable which exists in the current scope')
                .position(this.identifier.pos);
        }

        const iterator = array.val.__iter__({context});

        if (iterator instanceof Error) return iterator;

        while (true) {
            const nextRes = iterator.__next__({context});
            if (nextRes instanceof Error) return nextRes;
            if (nextRes instanceof ESErrorPrimitive && nextRes.__value__ instanceof EndIterator) {
                break;
            }

            const newContext = new Context();
            newContext.parent = context;

            newContext.set(this.identifier.value, nextRes, {
                global: this.isGlobalId,
                isConstant: this.isConstId,
                type: nextRes.__type__
            });

            const bodyRes = this.body.interpret(newContext);
            if (bodyRes.error || (bodyRes.funcReturn !== undefined)) {
                return bodyRes;
            }

            if (bodyRes.shouldBreak) {
                bodyRes.shouldBreak = false;
                break;
            }
            if (bodyRes.shouldContinue) {
                bodyRes.shouldContinue = false;
            }
        }

        return new InterpretResult(new ESNull());
    }

    compileJS (config: ICompileConfig) {

        const indent = ' '.repeat(config.indent);

        config.indent += 4;

        const iteratorRes = this.array.compileJS(config);
        if (iteratorRes.error) return iteratorRes;

        const bodyRes = this.body.compileJS(config);
        if (bodyRes.error) return bodyRes;

        let declaration = 'let';

        if (this.isGlobalId) {
            declaration = 'var';
        } else if (this.isConstId) {
            declaration = 'const';
        }

        if (config.minify) {
            return new CompileResult(`for(${declaration} ${this.identifier.value} of ${iteratorRes.val}){${bodyRes.val}\n${indent}}`);
        }

        return new CompileResult(`for (${declaration} ${this.identifier.value} of ${iteratorRes.val}) {\n${bodyRes.val}\n${indent}}`);
    }

    compilePy (config: ICompileConfig) {
        const res = new CompileResult;

        config.indent += 4;

        const iteratorRes = res.register(this.array, config);
        if (res.error) return res;

        const bodyRes = res.register(this.body, config);
        if (res.error) return res;

        // if it is global, then define it at the top
        if (this.isGlobalId) {
            res.hoisted += `${this.identifier.value}=None`;
        }

        res.val = `for ${this.identifier.value} in ${iteratorRes}:\n${bodyRes}`;

        return res;
    }

    str () {
        return '(for)';
    }
}

export class N_array extends Node {

    items: Node[];
    shouldClone: boolean;

    constructor(pos: Position, items: Node[], shouldClone=false) {
        super(pos);
        this.items = items;
        this.shouldClone = shouldClone
    }

    interpret_ (context: Context) {
        const result = new InterpretResult();
        const interpreted: Primitive[] = [];

        for (const item of this.items) {
            const res = item.interpret(context);
            if (res.error || (res.funcReturn !== undefined)) return res;
            if (!res.val) continue;
            let val = res.val;
            if (this.shouldClone) {
                val = val.clone({context});
            }
            interpreted.push(val);
        }

        result.val = new ESArray(interpreted);

        return result;
    }

    compileJS (config: ICompileConfig) {
        const res = new CompileResult('[');
        for (const item of this.items) {
            const itemRes = item.compileJS(config);
            if (itemRes.error) return itemRes;
            res.val += itemRes.val + ',';
        }
        res.val += ']';
        return res;
    }

    compilePy (config: ICompileConfig) {
        const res = new CompileResult('[');
        for (const item of this.items) {
            const itemRes = res.register(item, config);
            if (res.error) return res;
            res.val += itemRes + ',';
        }
        res.val += ']';
        return res;
    }

    str () {
        let res = '([';
        for (const item of this.items) {
            const itemRes = item.str();
            res += itemRes + ',';
        }
        res += '])';
        return res;
    }
}

export class N_objectLiteral extends Node {
    properties: [Node, Node][];
    constructor(pos: Position, properties: [Node, Node][]) {
        super(pos);
        this.properties = properties;
    }

    interpret_ (context: Context): InterpretResult | Error {
        const interpreted: Map<Primitive> = {};

        for (const [keyNode, valueNode] of this.properties) {
            const value = valueNode.interpret(context);
            if (value.error) return value.error;

            const key = keyNode.interpret(context);
            if (key.error) return key.error;

            if (key.val && value.val) {
                interpreted[key.val.__value__] = value.val;
            }
        }

        return new InterpretResult(new ESObject(interpreted));
    }

    compileJS (config: ICompileConfig) {
        const res = new CompileResult('{');
        for (const [keyNode, valueNode] of this.properties) {
            const value = valueNode.compileJS(config);
            if (value.error) return value;

            const key = keyNode.compileJS(config);
            if (key.error) return key;

            if (key.val && value.val) {
                res.val += `[${key.val}]: ${value.val},`;
            }
        }
        res.val += '}';
        return res;
    }

    compilePy (config: ICompileConfig) {
        const res = new CompileResult('{');
        for (const [keyNode, valueNode] of this.properties) {
            const value = res.register(valueNode, config);
            if (res.error) return res;

            const key = res.register(keyNode, config)
            if (res.error) return res;

            if (key && value) {
                res.val += `${key}: ${value},`;
            }
        }
        res.val += '}';
        return res;
    }

    str () {
        let res = '({';
        for (const [keyNode, valueNode] of this.properties) {

            if (keyNode.str() && valueNode.str()) {
                res += `[${keyNode.str()}]: ${valueNode.str()},`;
            }
        }
        res += '})';
        return res;
    }
}

export class N_statements extends Node {

    items: Node[];
    topLevel: boolean;

    constructor(pos: Position, items: Node[], topLevel=false) {
        super(pos);
        this.items = items;
        this.topLevel = topLevel;
    }

    interpret_ (context: Context): Error | InterpretResult {
        if (!this.topLevel) {
            let last;
            for (const item of this.items) {
                const res = item.interpret(context);
                if (res.error || res.funcReturn || res.shouldBreak || res.shouldContinue) {
                    return res;
                }
                // return last statement
                last = res.val;
            }

            return new InterpretResult(last || new ESNull());
        } else {
            const result = new InterpretResult();
            const interpreted: Primitive[] = [];

            for (const item of this.items) {
                const res = item.interpret(context);
                if (res.error || res.funcReturn || res.shouldBreak || res.shouldContinue) {
                    return res;
                }
                if (!res.val) continue;
                const val = res.val.clone({context});
                interpreted.push(val);
            }

            result.val = new ESArray(interpreted);

            return result;
        }
    }

    compileJS (config: ICompileConfig) {
        const res = new CompileResult;

        const indent = ' '.repeat(config.indent);

        res.val += indent;

        for (const item of this.items) {

            const itemRes = item.compileJS(config);
            if (itemRes.error) return itemRes;
            res.val += itemRes.val + ';';

            if (!config.minify) {
                res.val += '\n' + indent;
            }
        }
        return res;
    }

    compilePy (config: ICompileConfig) {
        const res = new CompileResult;

        const indent = ' '.repeat(config.indent);

        res.val += indent;

        for (const item of this.items) {

            const itemRes = res.register(item, config);
            if (res.error) return res;

            res.val += itemRes;
            res.val += '\n' + indent;
        }
        return res;
    }

    str () {
        let res = '(';
        for (const item of this.items) {
            res += item.str() + ';';
        }
        return res + ')';
    }
}

export class N_functionCall extends Node {
    to: Node;
    arguments: Node[];
    indefiniteKwargs: Node[];
    definiteKwargs: Map<Node>;
    optionallyChained: boolean;

    functionType: '__call__' | '__generic__';

    constructor (
        pos: Position,
        to: Node,
        args: Node[] = [],
        indefiniteKwargs: Node[] = [],
        definiteKwargs: Map<Node> = {},
        functionType: '__call__' | '__generic__' = '__call__',
        optionallyChained = false
    ) {
        super(pos);
        this.arguments = args;
        this.to = to;
        this.indefiniteKwargs = indefiniteKwargs;
        this.definiteKwargs = definiteKwargs;
        this.functionType = functionType;
        this.optionallyChained = optionallyChained;
    }

    interpret_ (context: Context): Error | InterpretResult {
        const { val, error } = this.to.interpret(context);
        if (error) {
            return error;
        }
        if (!val) {
            return new TypeError('any', 'undefined', undefined, 'On function call')
                .position(this.pos);
        }

        let args: Primitive[] = [];
        const kwargs: Map<Primitive> = {};

        for (const arg of this.arguments) {
            const res = arg.interpret(context);
            if (res.error) {
                return res.error;
            }
            if (res.val) {
                args.push(res.val);
            }
        }

        for (const node of this.indefiniteKwargs) {
            const res = node.interpret(context);
            if (res.error) return res.error;
            const val = res.val;

            if (val instanceof ESArray) {
                args = [...args, ...val.__value__];
                continue;
            }

            if (!(val instanceof ESNamespace) && !(val instanceof ESJSBinding) && !(val instanceof ESObject)) {
                return new TypeError('Namespace', str(val.__type_name__()));
            }

            const kwargPrim = val.__value__;

            for (const key of Object.keys(kwargPrim)) {
                kwargs[key] = kwargPrim[key];
            }
        }

        for (const key of Object.keys(this.definiteKwargs)) {
            const res = this.definiteKwargs[key].interpret(context);
            if (res.error) return res.error;
            kwargs[key] = res.val;
        }

        const res = val[this.functionType]({
            context,
            kwargs
        }, ...args);

        if (res instanceof Error) {
            // optionally chained functions return null on InvalidOperationError
            if (res.name === 'InvalidOperationError' && this.optionallyChained) {
                return new InterpretResult(new ESNull());
            }

            res.traceback.push({
                position: this.pos,
                // do the best we can to recreate line
                line: `${val.__info__.name || '<AnonFunction>'}(${args.map(str).join(', ')})`
            });
        }

        return new InterpretResult(res);
    }

    compileJS (config: ICompileConfig) {
        const res = new CompileResult;

        const funcRes = this.to.compileJS(config);
        if (funcRes.error) return funcRes;
        res.val = funcRes.val + '(';

        for (const arg of this.arguments) {
            const argRes = arg.compileJS(config);
            if (argRes.error) return argRes;
            res.val += argRes.val;
            if (arg !== this.arguments[this.arguments.length-1]) {
                res.val += ',';
                if (!config.minify) {
                    res.val += ' ';
                }
            }

        }

        res.val += ')';

        return res;
    }

    compilePy (config: ICompileConfig) {
        const res = new CompileResult;

        const funcRes = res.register(this.to, config);
        if (res.error) return res;

        res.val = funcRes + '(';
        for (const arg of this.arguments) {

            const argRes = res.register(arg, config);
            if (res.error) {
                return res;
            }

            res.val += argRes;
            // if it's not the last argument, add ', '
            if (arg !== this.arguments[this.arguments.length-1]) {
                res.val += ',';
                if (!config.minify) {
                    res.val += ' ';
                }
            }
        }
        res.val += ')';

        return res;
    }

    str () {
        let res = '(' + this.to.str() + '(';

        for (const arg of this.arguments) {
            res += arg.str();
            if (arg !== this.arguments[this.arguments.length-1]) {
                res += ',';
            }
        }

        return res + '))';
    }
}

export class N_functionDefinition extends Node {
    body: Node;
    arguments: IUninterpretedArgument[];
    name: string | undefined;
    this_: ESObject;
    returnType: Node;
    description: string;
    isDeclaration = false;
    allowArgs = false;
    allowKwargs = false;

    constructor(
        pos: Position,
        body: Node,
        argNames: IUninterpretedArgument[],
        returnType: Node,
        name?: string,
        this_: ESObject = new ESObject(),
        description=''
    ) {
        super(pos);
        this.arguments = argNames;
        this.body = body;
        this.name = name;
        this.this_ = this_;
        this.returnType = returnType;
        this.description = description;
    }

    interpret_ (context: Context): InterpretResult | Error {

        const returnTypeRes = this.returnType.interpret(context);
        if (returnTypeRes.error) return returnTypeRes.error;

        const funcPrim = new ESFunction(this.body, this.arguments, this.name, this.this_, returnTypeRes.val, context);

        funcPrim.__allow_kwargs__ = this.allowKwargs;
        funcPrim.__allow_args__ = this.allowArgs;

        if (this.isDeclaration) {
            if (!this.name) {
                return new InvalidSyntaxError('Function declaration must have a name');
            }
            if (context.hasOwn(this.name)) {
                return new InvalidSyntaxError(`Cannot redeclare symbol '${this.name}'`);
            }

            context.setOwn(this.name, funcPrim, {
                isConstant: true,
                type: types.function
            });
        }

        return new InterpretResult(funcPrim);
    }

    compileJS (config: ICompileConfig) {
        const res = new CompileResult(`${this.name ? '' : '('}function ${this.name || ''}(`);

        for (const param of this.arguments) {
            res.val += param.name + ',';
            if (!config.minify) {
                res.val += ' ';
            }
        }
        if (config.minify) {
            res.val += '){';
        } else {
            res.val += ') {\n';
        }

        const indent = ' '.repeat(config.indent);

        config.indent += 4;
        const bodyRes = this.body.compileJS(config);
        if (bodyRes.error) return bodyRes;
        res.val += `${bodyRes.val}\n${indent}}${this.name ? '' : ')'}`;
        return res;
    }

    compilePy (config: ICompileConfig) {
        const res = new CompileResult;

        const hoistedName = generateRandomSymbol(config.symbols);

        res.hoisted = `def ${hoistedName}(`;

        for (const param of this.arguments) {
            res.hoisted += param.name + ',';
            if (!config.minify) {
                res.hoisted += ' ';
            }
        }

        const indent = ' '.repeat(config.indent);

        config.indent += 4;
        const body = this.body.compilePy(config);
        if (body.error) return body;

        res.hoisted += `):\n${indent}${body.val}`;

        res.hoisted = body.hoisted + res.hoisted;
        res.val = hoistedName;

        return res;
    }

    str () {
        return '(func(){})';
    }
}

export class N_return extends Node {
    value: Node | undefined;
    constructor(pos: Position, value: Node | undefined) {
        super(pos);
        this.value = value;
    }

    interpret_ (context: Context) {
        const res = new InterpretResult();

        if (this.value === undefined)  {
            res.funcReturn = new ESNull();
            return res;
        }

        const val = this.value.interpret(context);
        if (val.error) return val.error;

        res.funcReturn = val.val;
        return res;
    }

    compileJS (config: ICompileConfig): CompileResult {
        const valRes = this.value?.compileJS(config);
        if (valRes?.error) return valRes;
        return new CompileResult(`return(${valRes?.val})`);
    }

    compilePy (config: ICompileConfig): CompileResult {
        const res = new CompileResult;
        if (!this.value) {
            return new CompileResult('return');
        }
        const valRes = res.register(this.value, config);
        if (res.error) return res;
        return new CompileResult(`return ${valRes}`);
    }

    str () {
        return '(return ' + this.value?.str() || '' + ')';
    }
}

export class N_yield extends Node {
    value: Node | undefined;
    constructor(pos: Position, value: Node | undefined) {
        super(pos);
        this.value = value;
    }

    interpret_ (context: Context) {
        const res = new InterpretResult();

        if (this.value === undefined)  {
            res.funcReturn = new ESNull();
            return res;
        }

        const val = this.value.interpret(context);
        if (val.error) return val.error;

        if (val.val?.bool({context}).__value__) {
            res.funcReturn = val.val;
        }

        return res;
    }

    compileJS (config: ICompileConfig): CompileResult {
        const valRes = this.value?.compileJS(config);
        if (!valRes || !valRes.val) {
            return new CompileResult('');
        }
        return new CompileResult(`if(_=${valRes.val}){return(_))`);
    }

    compilePy (config: ICompileConfig): CompileResult {
        if (!this.value) {
            return new CompileResult('');
        }

        const res = new CompileResult;
        const valRes = res.register(this.value, config);
        if (!valRes) {
            return new CompileResult('');
        }
        return new CompileResult(`if _ := ${valRes}: return _`);
    }

    str () {
        return '(yield ' + this.value?.str() || '' + ')';
    }
}

export class N_indexed extends Node {
    base: Node;
    index: Node;
    // not undefined if setting value
    value: Node | undefined;
    assignType: string | undefined;

    isOptionallyChained: boolean;

    constructor(pos: Position, base: Node, index: Node, isOptionallyChained=false) {
        super(pos);
        this.base = base;
        this.index = index;
        this.isOptionallyChained = isOptionallyChained;
    }

    interpret_ (context: Context): Error | InterpretResult {
        const baseRes = this.base.interpret(context);
        if (baseRes.error) return baseRes;

        const indexRes = this.index.interpret(context);
        if (indexRes.error) return indexRes;

        const index = indexRes.val;
        const base = baseRes.val;

        if (!base || !index) {
            return new InterpretResult(new ESNull());
        }

        // assign
        if (this.value) {
            if (this.isOptionallyChained) {
                return new InvalidSyntaxError('Cannot assign to optionally chained property accessor')
                    .position(this.pos);
            }
            const valRes = this.value.interpret(context);
            if (valRes.error) return valRes;

            const currentVal = wrap(base.__get__({context}, index));
            let newVal: Primitive | Error;
            const assignVal = valRes.val;
            this.assignType ??= '=';

            if (!assignVal) {
                return new TypeError('~nil', 'nil')
                    .position(this.pos);
            }

            switch (this.assignType[0]) {
                case '*':
                    newVal = currentVal.__multiply__({context}, assignVal); break;
                case '/':
                    newVal = currentVal.__divide__({context}, assignVal); break;
                case '+':
                    newVal = currentVal.__add__({context}, assignVal); break;
                case '-':
                    newVal = currentVal.__subtract__({context}, assignVal); break;
                case '=':
                    newVal = assignVal; break;

                default:
                    return new Error(
                        'AssignError',
                        `Cannot find assignType of ${this.assignType[0]}`
                    ).position(this.pos);
            }

            if (newVal instanceof Error) {
                return newVal;
            }

            if (!base.__set__) {
                return new TypeError('mutable', 'immutable', base.__value__)
                    .position(this.pos);
            }

            const res = base.__set__({context}, index, newVal ?? new ESNull());
            if (res instanceof Error) {
                return res;
            }
        }
        let finalVal = base.__get__({context}, index);
        if (this.isOptionallyChained && finalVal instanceof Error) {
            finalVal = new ESNull();
        }
        return new InterpretResult(finalVal);
    }

    compileJS (config: ICompileConfig) {
        const objectRes = this.base.compileJS(config);
        if (objectRes.error) return objectRes;

        const keyRes = this.index.compileJS(config);
        if (keyRes.error) return keyRes;

        if (!this.value) {
            return new CompileResult(`${objectRes.val}[${keyRes.val}]`);
        }

        const valRes = this.value.compileJS(config);
        if (valRes.error) return valRes;

        return new CompileResult(`${objectRes.val}[${keyRes.val}]${this.assignType||'='}${valRes.val}`);
    }

    compilePy (config: ICompileConfig): CompileResult {
        const res = new CompileResult;
        const objectRes = res.register(this.base, config);
        if (res.error) return res;

        const keyRes = res.register(this.index, config);
        if (res.error) return res;

        if (!this.value) {
            res.val = `${objectRes}[${keyRes}]`;
            return res;
        }

        const valRes = res.register(this.value, config);
        if (res.error) return res;

        res.val = `${objectRes}[${keyRes}] ${this.assignType||'='} ${valRes}`;
        return res;
    }

    str () {
        const objectRes = this.base.str()
        const keyRes = this.index.str()

        if (!this.value) {
            return `(${objectRes}[${keyRes}])`;
        }

        const valRes = this.value.str()
        return `(${objectRes}[${keyRes}]${this.assignType||'='}${valRes})`;
    }
}

export class N_class extends Node {

    init: N_functionDefinition | undefined;
    methods: N_functionDefinition[];
    staticMethods: N_functionDefinition[];
    name?: string;
    extends_?: Node;
    isDeclaration: boolean;
    abstract: boolean;
    properties: Map<Node>;
    staticProperties: Map<Node>;
    genericParams: IUninterpretedArgument[];

    constructor(
        pos: Position,
        methods: N_functionDefinition[],
        properties: Map<Node>,
        staticMethods: N_functionDefinition[],
        staticProperties: Map<Node>,
        genericParams: IUninterpretedArgument[],
        extends_?: Node,
        init?: N_functionDefinition,
        name?: string,
        isDeclaration=false,
        abstract = false
    ) {
        super(pos);
        this.name = name;
        this.methods = methods;
        this.properties = properties;
        this.staticMethods = staticMethods;
        this.staticProperties = staticProperties;
        this.genericParams = genericParams;
        this.init = init;
        this.extends_ = extends_;
        this.isDeclaration = isDeclaration;
        this.abstract = abstract;
    }

    interpret_ (context: Context): InterpretResult | Error {

        const properties: Map<Primitive> = {};
        const methods: ESFunction[] = [];

        const closure = new Context();
        closure.parent = context;

        for (const method of this.methods) {
            const res = method.interpret(closure);
            if (res.error) {
                return res.error;
            }
            if (!(res.val instanceof ESFunction)) {
                return new TypeError(
                    'Function',
                    res.val?.__type_name__() || 'undefined',
                    'method on ' + this.name
                ).position(this.pos);
            }
            methods.push(res.val);
        }

        for (const id of Object.keys(this.properties)) {
            const res = this.properties[id].interpret(closure);
            if (res.error) return res.error;
            properties[id] = res.val;
        }

        let extends_: ESType = types.object;
        if (this.extends_) {
            const extendsRes = this.extends_.interpret(closure);
            if (extendsRes.error) {
                return extendsRes.error;
            }
            if (!(extendsRes.val instanceof ESType)) {
                return new TypeError(
                    'Type',
                    extendsRes.val?.__type_name__() || 'undefined',
                    'method on ' + this.name
                ).position(this.pos);
            }
            extends_ = extendsRes.val;
        }

        let init;
        if (this.init) {
            const initRes = this.init.interpret(closure);
            if (initRes.error) {
                return initRes.error;
            }
            if (!(initRes.val instanceof ESFunction)) {
                return new TypeError(
                    'Function',
                    initRes.val?.__type_name__() || 'undefined',
                    'method on ' + this.name
                ).position(this.pos);
            }
            init = initRes.val;
        }

        if (init) {
            methods.push(init);
        }

        const typePrim = new ESType(
            false,
            this.name,
            methods,
            properties,
            extends_,
            [],
            this.abstract
        );

        if (this.isDeclaration) {
            if (typeof this.name !== 'string') {
                return new InvalidSyntaxError('Class declaration must have a name').position(this.pos);
            }
            if (context.hasOwn(this.name)) {
                return new InvalidSyntaxError(`Cannot redeclare symbol '${this.name}'`);
            }

            context.setOwn(this.name, typePrim, {
                isConstant: true,
                type: types.type
            });
        }

        return new InterpretResult(typePrim);
    }

    compileJS (config: ICompileConfig) {
        let res = `${this.name ? '' : '('}function ${this.name || ''}() {`;

        const iniRes = this.init?.compileJS(config);
        if (iniRes?.error) return iniRes;
        if (iniRes) {
            res += iniRes.val;
        }
        res += ';return {';

        for (const func of this.methods) {
            res += `${func.name || ''}(`;

            for (const param of func.arguments) {
                res += `${param.name},`;
                if (!config.minify) {
                    res += ' ';
                }
            }
            if (config.minify) {
                res += '){';
            } else {
                res += ') {\n';
            }

            const indent = ' '.repeat(config.indent);

            config.indent += 4;
            const bodyRes = func.body.compileJS(config);
            if (bodyRes.error) return bodyRes;
            res += `${bodyRes.val}\n${indent}}`;
        }

        res += `}${this.name ? '' : ')'}}`;

        return new CompileResult(res);
    }

    compilePy () {
        return new CompileResult(`class ${this.name}: pass`);
    }

    str () {
        return 'class';
    }
}

export class N_namespace extends Node {

    public name?: Node;
    private readonly statements: Node;
    public mutable: boolean;
    private readonly isDeclaration: boolean;

    constructor (pos: Position, statements: Node, name?: Node, mutable=false, isDeclaration=false) {
        super(pos);
        this.name = name;
        this.statements = statements;
        this.mutable = mutable;
        this.isDeclaration = isDeclaration;
    }

    interpret_ (context: Context): Error | InterpretResult {
        const newContext = new Context();
        newContext.parent = context;

        const res = this.statements.interpret(newContext);
        if (res.error) return res;

        const symbols = newContext.getSymbolTableAsDict();

        if (this.isDeclaration) {
            if (this.name instanceof N_variable) {

                const n = new ESNamespace(new ESString(this.name.a.value), symbols, this.mutable);

                if (context.hasOwn(this.name.a.value)) {
                    return new InvalidSyntaxError(`Cannot redeclare symbol '${this.name}'`);
                }

                context.setOwn(this.name.a.value, n);

                newContext.clear();
                return new InterpretResult(n);
            }
        }

        newContext.clear();
        const n = new ESNamespace(new ESString('(anon)'), symbols, this.mutable);
        return new InterpretResult(n);
    }

    compileJS (config: ICompileConfig) {
        const bodyRes = this.statements.compileJS(config);
        if (bodyRes.error) return bodyRes;

        return new CompileResult(`(() => {${bodyRes.val}})()`);
    }

    compilePy () {
        const res = new CompileResult;
        //const bodyRes = res.register(this.statements, config);
        if (res.error) return res;

        res.val = `'namespace'`;
        return res;
    }

    str () {
        return '(namespace {})';
    }
}


export class N_tryCatch extends Node {

    body: Node;
    catchBlock: Node;

    constructor(pos: Position, body: Node, catchBlock: Node) {
        super(pos, true);
        this.body = body;
        this.catchBlock = catchBlock;
    }

    interpret_ (context: Context): Error | InterpretResult {
        const res = this.body.interpret(context);

        if (!res.error) {
            return new InterpretResult();
        }

        const newContext = new Context();
        newContext.parent = context;
        newContext.setOwn(CATCH_BLOCK_ERR_SYMBOL_ID, new ESErrorPrimitive(res.error), {
            isConstant: true
        });
        const catchRes = this.catchBlock.interpret(newContext);
        if (catchRes.error) return catchRes.error;

        newContext.clear();

        return new InterpretResult();
    }

    compileJS (config: ICompileConfig) {
        const bodyRes = this.body.compileJS(config);
        if (bodyRes.error) return bodyRes;

        const catchRes = this.catchBlock.compileJS(config);
        if (catchRes.error) return catchRes;

        return new CompileResult(`try{${bodyRes.val}}catch(${CATCH_BLOCK_ERR_SYMBOL_ID}){${catchRes.val}}`);
    }

    compilePy (config: ICompileConfig) {
        const res = new CompileResult;

        const bodyRes = res.register(this.body, config);
        if (res.error) return res;

        const catchRes = res.register(this.catchBlock, config);
        if (res.error) return res;

        const indent = ' '.repeat(config.indent);
        const highIndent = ' '.repeat(config.indent + 1);

        res.val = `try:\n${highIndent}${bodyRes}\n${indent}except:\n${highIndent}${catchRes}`;
        return res;
    }

    str () {
        return '(try {} catch {})';
    }
}

// --- TERMINAL NODES ---
export class N_number extends Node {
    a: Token<number>;
    constructor(pos: Position, a: Token<number>) {
        super(pos, true);
        this.a = a;
    }
    interpret_ (): InterpretResult | Error {
        const val = this.a.value;

        const res = new InterpretResult();
        res.val = new ESNumber(val);
        return res;
    }

    compileJS () {
        return new CompileResult(this.a.value.toString());
    }

    compilePy () {
        return new CompileResult(this.a.value.toString());
    }

    str () {
        return '(' + this.a.value.toString() + ')';
    }
}

export class N_string extends Node {

    a: Token<string>;

    constructor (pos: Position, a: Token<string>) {
        super(pos, true);
        this.a = a;
    }

    interpret_ (): InterpretResult | Error {
        const val = this.a.value;
        return new InterpretResult(new ESString(val));
    }

    compileJS () {
        return new CompileResult(`'${this.a.value}'`);
    }

    compilePy () {
        return new CompileResult(`'${this.a.value}'`);
    }
    str () {
        return '(' + this.a.value.toString() + ')';
    }
}

export class N_variable extends Node {

    a: Token<string>;

    constructor(a: Token<string>) {
        super(a.pos, true);
        this.a = a;
    }

    interpret_ (context: Context): Error | InterpretResult {
        if (!context.has(this.a.value)) {
            return new ReferenceError(this.a.value)
                .position(this.a.pos);
        }

        const res = new InterpretResult();
        const symbol = context.getSymbol(this.a.value);

        if (!symbol) {
            return new ReferenceError(`No access to undeclared variable ${this.a.value}`).position(this.pos);
        }
        if (symbol instanceof Error) {
            return symbol;
        }

        res.val = symbol.value;

        return res;
    }

    compileJS () {
        let val = this.a.value.toString();
        if (val === 'import') {
            val = 'import_';
        }
        return new CompileResult(val);
    }

    compilePy (): CompileResult {
        let val = this.a.value.toString();
        if (val === 'import') {
            val = 'import_';
        }
        return new CompileResult(val);
    }

    str () {
        return '(' + this.a.value.toString() + ')';
    }
}

export class N_undefined extends Node {

    constructor(pos = Position.void) {
        super(pos, true);
    }

    interpret_ () {
        const res = new InterpretResult();
        res.val = new ESNull();
        return res;
    }

    compileJS () {
        return new CompileResult('undefined');
    }

    compilePy () {
        return new CompileResult('None');
    }
    str () {
        return '(nil)';
    }
}

export class N_break extends Node {
    constructor(pos: Position) {
        super(pos, true);
    }

    interpret_ () {
        const res = new InterpretResult();
        res.shouldBreak = true;
        return res;
    }

    compileJS () {
        return new CompileResult('break');
    }

    compilePy () {
        return new CompileResult('break');
    }
    str () {
        return '(break)';
    }
}
export class N_continue extends Node {
    constructor(pos: Position) {
        super(pos, true);
    }

    interpret_ () {
        const res = new InterpretResult();
        res.shouldContinue = true;
        return res;
    }

    compileJS () {
        return new CompileResult('continue');
    }

    compilePy () {
        return new CompileResult('continue');
    }
    str () {
        return '(continue)';
    }
}

export class N_primitiveWrapper extends Node {
    value: Primitive;

    constructor(val: Primitive, pos = Position.void) {
        super(pos, true);
        this.value = val;
    }

    public interpret_(): InterpretResult {
        return new InterpretResult(this.value);
    }

    compileJS () {
        return new CompileResult(JSON.stringify(this.value.__value__));
    }

    compilePy () {
        return new CompileResult(JSON.stringify(this.value.__value__));
    }
    str () {
        return '(primitive)';
    }
}