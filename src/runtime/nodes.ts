import { Token } from "../parse/tokens";
import { ESError, InvalidSyntaxError, ReferenceError, TypeError } from "../errors";
import { Context } from './context';
import Position from "../position";
import { catchBlockErrorSymbolName, compileConfig, now, tokenTypeString, tt, types } from "../util/constants.js";
import { interpretArgument, runtimeArgument, uninterpretedArgument } from "./argument";
import { wrap } from './primitives/wrapStrip';
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
    ESUndefined,
    Primitive
} from "./primitiveTypes";
import {dict, generateRandomSymbol, str} from '../util/util';
import { ESTypeNot, ESTypeUnion } from "./primitives/estype";

export class interpretResult {
    val: Primitive = new ESUndefined();
    error: ESError | undefined;
    funcReturn: Primitive | undefined;
    shouldBreak = false;
    shouldContinue = false;

    constructor (val?: Primitive | ESError) {
        if (val instanceof ESError) {
            this.error = val;
        } else if (val) {
            this.val = val;
        }
    }
}

export class compileResult {
    val: string = '';
    // for hoisting declarations to the start of the file, gets added after STD
    hoisted: string = '';
    error: ESError | undefined;

    constructor (val?: string | ESError) {
        if (typeof val === 'string') {
            this.val = val;
        } else if (val) {
            this.error = val;
        }
    }

    register (node: Node, config: compileConfig): string {
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

    abstract interpret_ (context: Context): ESError | interpretResult;

    interpret (context: Context): interpretResult {
        const start = now();
        const res = new interpretResult;
        const val = this.interpret_(context);

        if (val instanceof ESError) {
            res.error = val;
        }

        else if (val instanceof interpretResult) {
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
            res.error = new TypeError(Position.void, 'Primitive',
                'Native JS value', str(res.val));
            res.val = new ESUndefined();
        }

        res.val.info.file ||= this.pos.file;

        Node.interprets++;
        let time = now() - start;
        Node.totalTime += time;
        if (time > Node.maxTime) Node.maxTime = time;

        return res;
    }

    abstract compileJS (config: compileConfig): compileResult;
    abstract compilePy (config: compileConfig): compileResult;
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

     interpret_(context: Context): ESError | interpretResult {
        const left = this.left.interpret(context);
        if (left.error) return left.error;
        const right = this.right.interpret(context);
        if (right.error) return right.error;

        const l = left.val;
        const r = right.val;
        if (typeof l === 'undefined') {
            return new TypeError(this.opTok.pos, '~undefined', 'undefined', l, 'N_binOp.interpret_');
        }

        if (typeof r === 'undefined') {
            return new TypeError(this.opTok.pos, '~undefined', 'undefined', r, 'N_binOp.interpret_');
        }

        switch (this.opTok.type) {
            case tt.LTE: {
                const lt = l.__lt__({context}, r);
                const eq = l.__eq__({context}, r);
                if (lt instanceof ESError) return lt;
                if (eq instanceof ESError) return eq;
                return new interpretResult(lt.__or__({context}, eq));

            } case tt.GTE: {
                const gt = l.__gt__({context}, r);
                const eq = l.__eq__({context}, r);
                if (gt instanceof ESError) return gt;
                if (eq instanceof ESError) return eq;
                return new interpretResult(gt.__or__({context}, eq));

            } case tt.NOTEQUALS: {
                const res = l.__eq__({context}, r);
                if (res instanceof ESError) return res;
                return new interpretResult(new ESBoolean(!res.bool().valueOf()));

            } case tt.ADD:
                return new interpretResult(l.__add__({context}, r));
            case tt.SUB:
                return new interpretResult(l.__subtract__({context}, r));
            case tt.MUL:
                return new interpretResult(l.__multiply__({context}, r));
            case tt.DIV:
                return new interpretResult(l.__divide__({context}, r));
            case tt.POW:
                return new interpretResult(l.__pow__({context}, r));
            case tt.MOD:
                return new interpretResult(l.__mod__({context}, r));
            case tt.EQUALS:
                return new interpretResult(l.__eq__({context}, r));
            case tt.LT:
                return new interpretResult(l.__lt__({context}, r));
            case tt.GT:
                return new interpretResult(l.__gt__({context}, r));
            case tt.AND:
                return new interpretResult(l.__and__({context}, r));
            case tt.OR:
                return new interpretResult(l.__or__({context}, r));
            case tt.APMERSAND:
                return new interpretResult(l.__ampersand__({context}, r));
            case tt.PIPE:
                return new interpretResult(l.__pipe__({context}, r));

            default:
                return new InvalidSyntaxError(
                    this.opTok.pos,
                    `Invalid binary operator: ${tokenTypeString[this.opTok.type]}`
                );
        }
    }

    compileJS (config: compileConfig) {
        const left = this.left.compileJS(config);
        if (left.error) return left;
        const right = this.right.compileJS(config);
        if (right.error) return right;

        if (config.minify) {
            return new compileResult(`${left.val}${tokenTypeString[this.opTok.type]}${right.val}`);
        }
        return new compileResult(`${left.val} ${tokenTypeString[this.opTok.type]} ${right.val}`);
    }

    public compilePy(config: compileConfig): compileResult {
        const left = this.left.compilePy(config);
        if (left.error) return left;
        const right = this.right.compilePy(config);
        if (right.error) return right;

        const switchers: dict<string> = {
            '&&': 'and',
            '||': 'or',
            '^': '**',
        }

        let op = tokenTypeString[this.opTok.type];
        if (op in switchers) {
            op = switchers[op];
        }

        return new compileResult(`${left.val} ${op} ${right.val}`);
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

    interpret_(context: Context): ESError | interpretResult {
        const res = this.a.interpret(context);
        if (res.error) return res.error;

        switch (this.opTok.type) {
            case tt.SUB:
            case tt.ADD:
                if (!(res.val instanceof ESNumber)) {
                    return new TypeError(
                        this.pos,
                        'Number',
                        res.val?.typeName().toString() || 'undefined_',
                        res.val?.valueOf()
                    );
                }
                const numVal = res.val.valueOf();
                return new interpretResult(new ESNumber(
                    this.opTok.type === tt.SUB ? -numVal : Math.abs(numVal)));
            case tt.NOT:
                return new interpretResult(new ESBoolean(!res?.val?.bool().valueOf()));
            case tt.BITWISE_NOT:
                return new interpretResult(new ESTypeNot(res.val));
            case tt.QM:
                return new interpretResult(new ESTypeUnion(types.undefined, res.val));

            default:
                return new InvalidSyntaxError(
                    this.opTok.pos,
                    `Invalid unary operator: ${tokenTypeString[this.opTok.type]}`
                );
        }
    }

    compileJS (config: compileConfig) {
        const val = this.a.compileJS(config);
        if (val.error) return val;

        return new compileResult(`${tokenTypeString[this.opTok.type]}${val.val}`);
    }

    compilePy (config: compileConfig) {
        const val = this.a.compilePy(config);
        if (val.error) return val;

        return new compileResult(`${tokenTypeString[this.opTok.type]}${val.val}`);
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

    interpret_(context: Context): interpretResult | ESError {

        if (this.isDeclaration) {
            if (context.hasOwn(this.varNameTok.value)) {
                return new InvalidSyntaxError(this.pos,
                    `Symbol '${ this.varNameTok.value }' already exists, and cannot be redeclared`);
            }

            if (this.assignType !== '=') {
                return new InvalidSyntaxError(this.pos,
                    `Cannot declare variable with operator '${ this.assignType }'`);
            }
        }

        const res = this.value.interpret(context);
        const typeRes = this.type.interpret(context);

        if (res.error) return res.error;
        if (typeRes.error) return typeRes.error;

        if (!typeRes.val) {
            return new TypeError(
                this.varNameTok.pos,
                'Type',
                'undefined'
            );
        }

        if (!res.val) {
            return new TypeError(this.varNameTok.pos, '~undefined', 'undefined', 'N_varAssign.interpret_');
        }

        const typeCheckRes = typeRes.val.type_check({context}, res.val);
        if (typeCheckRes instanceof ESError) return typeCheckRes;

        if (!typeCheckRes.bool().valueOf()) {
            return new TypeError(this.varNameTok.pos,
                str(typeRes.val),
                str(res.val?.typeName()),
                str(res.val)
            );
        }


        if (this.isDeclaration) {
            context.setOwn(this.varNameTok.value, res.val, {
                global: false,
                isConstant: this.isConstant,
                type: typeRes.val
            });
            return new interpretResult(res.val);
        }

        if (context.has(this.varNameTok.value)) {
            const symbol = context.getSymbol(this.varNameTok.value);
            if (symbol instanceof ESError) {
                return symbol;
            }
            if (symbol) {
                if (!symbol.type.type_check({context}, res.val).valueOf()) {
                    return new TypeError(
                        this.varNameTok.pos,
                        str(symbol.type),
                        res.val?.typeName(),
                        str(res.val)
                    );
                }
            }
        }

        if (this.assignType === '=') {
            // simple assign
            let value = res.val;
            if (value === undefined) {
                value = new ESUndefined();
            }

            const type = context.getSymbol(this.varNameTok.value);

            if (type instanceof ESError) {
                return type;
            }
            if (!type) {
                return new InvalidSyntaxError(this.pos,
                    `Cannot declare variable without keyword`);
            }

            const typeCheckRes = type.type.type_check({context}, res.val);

            if (typeCheckRes instanceof ESError) return typeCheckRes;

            if (!typeCheckRes.bool().valueOf()) {
                return new TypeError(Position.void, str(type.type), str(res.val.__type__), str(res.val));
            }

            const setRes = context.set(this.varNameTok.value, value, {
                global: this.isGlobal,
                isConstant: this.isConstant,
                type: type.type
            });

            if (setRes instanceof ESError) {
                return setRes;
            }

        } else {

            // assign with modifier like *= or -=
            const currentVal = context.get(this.varNameTok.value);
            if (currentVal instanceof ESError) return currentVal;

            if (currentVal == undefined)
                return new InvalidSyntaxError(this.pos,
                    `Cannot declare variable with operator '${this.assignType}'`);

            let newVal: Primitive | ESError;
            let assignVal = res.val;

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
                    return new ESError(
                        this.pos,
                        'AssignError',
                        `Cannot find assignType of ${this.assignType[0]}`
                    );
            }

            if (newVal instanceof ESError) {
                return newVal;
            }

            let setRes = context.set(this.varNameTok.value, newVal, {
                global: this.isGlobal,
                isConstant: this.isConstant,
                type: newVal.__type__
            });

            if (setRes instanceof ESError) return setRes;
            res.val = newVal;
        }

        if (res.val.info.name === '(anonymous)' || !res.val.info.name) {
            res.val.info.name = this.varNameTok.value;
        }

        return res;
    }

    compileJS (config: compileConfig) {
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
            return new compileResult(`${declaration} ${this.varNameTok.value}${assign}${val.val}`);
        }
        return new compileResult(`${declaration} ${this.varNameTok.value} ${assign} ${val.val}`);
    }

    compilePy (config: compileConfig) {
        const res = new compileResult

        const val = this.value.compilePy(config);
        if (val.error) return val;
        res.hoisted += val.hoisted;

        let assign = this.assignType;
        if (assign !== '=') {
            assign += '=';
        }


        // if it is global then defined it at the top
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
}

export class N_arrayDestructAssign extends Node {
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

    interpret_(context: Context): interpretResult | ESError {

        for (let varName of this.varNames) {
            if (context.hasOwn(varName)) {
                return new InvalidSyntaxError(this.pos,
                    `Symbol '${varName}' already exists, and cannot be redeclared`);
            }
        }

        const res = this.value.interpret(context);
        if (res.error) return res.error;

        if (res.val instanceof ESArray || res.val instanceof ESString) {

            // TODO: be smarter about this due to possibly undefined types
            if (this.varNames.length > res.val.valueOf().length) {
                return new TypeError(Position.void,
                    `[Any * >=${this.varNames.length}]`,
                    `[Any * <${this.varNames.length}]`, str(res.val));
            }

            let i = 0;
            for (let varName of this.varNames) {
                let val: Primitive | string = res.val.valueOf()[i];
                // for doing strings
                if (typeof val === 'string') {
                    val = new ESString(val);
                }

                let typeRes = this.types[i].interpret(context);
                if (typeRes.error) return typeRes;

                let typeCheckRes = typeRes.val.type_check({context}, val);
                if (typeCheckRes instanceof ESError) return typeCheckRes;

                if (!typeCheckRes.bool().valueOf()) {
                    return new TypeError(Position.void, str(typeRes.val), val.typeName(), str(val));
                }

                context.setOwn(varName, val, {
                    global: this.isGlobal,
                    isConstant: this.isConstant,
                    type: res.val.__type__
                });
                i++;
            }

            return new interpretResult(res.val);
        }

        let i = 0;
        for (let varName of this.varNames) {
            let objPropRes =  res.val.__get_property__({context}, new ESString(varName));
            if (objPropRes instanceof ESError) return objPropRes;

            let typeRes = this.types[i].interpret(context);
            if (typeRes.error) return typeRes;

            let typeCheckRes = typeRes.val.type_check({context}, objPropRes);
            if (typeCheckRes instanceof ESError) return typeCheckRes;

            if (!typeCheckRes.bool().valueOf()) {
                return new TypeError(Position.void, str(typeRes.val), objPropRes.typeName(), str(objPropRes));
            }

            context.setOwn(varName, objPropRes, {
                global: this.isGlobal,
                isConstant: this.isConstant,
                type: res.val.__type__
            });
            i++;
        }

        return new interpretResult(res.val);
    }

    compileJS (config: compileConfig) {
        const val = this.value.compileJS(config);
        if (val.error) return val;

        let declaration = '';

        if (this.isGlobal) {
            declaration = 'var';
        } else if (this.isConstant) {
            declaration = 'const';
        } else {
            declaration = 'let';
        }

        if (config.minify) {
            return new compileResult(`${declaration}[${this.varNames.join(',')}]=${val.val}`);
        }
        return new compileResult(`${declaration} [${this.varNames.join(', ')}] = ${val.val}`);
    }

    compilePy (config: compileConfig) {
        const val = this.value.compileJS(config);
        if (val.error) return val;

        return new compileResult(`${this.varNames.join(', ')} = ${val.val}`);
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

    interpret_(context: Context): interpretResult {
        let newContext = new Context();
        newContext.parent = context;
        let res: interpretResult = new interpretResult();

        let compRes = this.comparison.interpret(context);
        if (compRes.error) return compRes;

        if (compRes.val?.bool().valueOf()) {
            return this.ifTrue.interpret(newContext);

        } else if (this.ifFalse) {
            return this.ifFalse.interpret(newContext);
        }

        return res;
    }

    compileJS (config: compileConfig) {
        const indent = ' '.repeat(config.indent);
        const highIndent = ' '.repeat(config.indent+4);

        config.indent += 4;

        const statementRes = this.comparison.compileJS(config);
        if (statementRes.error) return statementRes;

        const ifTrueRes = this.ifTrue.compileJS(config);
        if (ifTrueRes.error) return ifTrueRes;

        if (!this.ifFalse) {
            if (config.minify) {
                return new compileResult(`if(${statementRes.val}){${ifTrueRes.val}\n}`);
            }
            return new compileResult(`if (${statementRes.val}) {\n${ifTrueRes.val}\n}`);
        }

        config.indent = highIndent.length;

        let ifFalseRes = this.ifFalse.compileJS(config);
        if (ifFalseRes.error) return ifFalseRes;

        if (!(this.ifFalse instanceof N_statements)) {
            ifFalseRes.val = highIndent + ifFalseRes.val;
        }

        if (config.minify) {
            return new compileResult(`if(${statementRes.val}){${ifTrueRes.val}}else{${ifFalseRes.val}}`);
        }

        return new compileResult(
            `if (${statementRes.val}) {\n${ifTrueRes.val}\n${indent}} else {\n${ifFalseRes.val}\n${indent}}`);
    }

    compilePy (config: compileConfig) {
        const res = new compileResult;

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
            return new compileResult(`if ${statementRes.val}:\n${highIndent}${ifTrueRes.val}`);
        }

        const ifFalseRes = this.ifFalse.compilePy(config);
        if (ifFalseRes.error) return ifFalseRes;
        res.hoisted += ifFalseRes.hoisted;

        if (!(this.ifFalse instanceof N_statements)) {
            ifFalseRes.val = highIndent + ifFalseRes.val;
        }

        return new compileResult(
            `if ${statementRes.val}:\n${ifTrueRes.val}\n${indent}else:\n${ifFalseRes.val}\n${indent}`);
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

    interpret_(context: Context): ESError | interpretResult {
        while (true) {
            let newContext = new Context();
            newContext.parent = context;

            let shouldLoop = this.comparison.interpret(context);
            if (shouldLoop.error) return shouldLoop;

            if (!shouldLoop.val?.bool()?.valueOf()) break;

            let potentialError = this.loop.interpret(newContext)
            if (potentialError.error) return potentialError;
            if (potentialError.shouldBreak) break;
        }
        return new interpretResult(new ESUndefined());
    }

    compileJS (config: compileConfig) {

        config.indent += 4;

        const comparisonRes = this.comparison.compileJS(config);
        if (comparisonRes.error) return comparisonRes;

        const bodyRes = this.loop.compileJS(config);
        if (bodyRes.error) return bodyRes;

        if (config.minify) {
            return new compileResult(`while(${comparisonRes.val}){${bodyRes.val}}`);
        }
        return new compileResult(`while (${comparisonRes.val}) {\n${bodyRes.val}}`);
    }

    compilePy (config: compileConfig) {
        const res = new compileResult;

        const highIndent = ' '.repeat(config.indent || 0);

        const comparisonRes = this.comparison.compilePy(config);
        if (comparisonRes.error) return comparisonRes;
        res.hoisted += comparisonRes.hoisted;

        const bodyRes = this.loop.compilePy(config);
        if (bodyRes.error) return bodyRes;
        res.hoisted += bodyRes.hoisted;

        return new compileResult(`while ${comparisonRes.val}:\n${highIndent}${bodyRes.val}`);
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

    interpret_ (context: Context): ESError | interpretResult {
        const array = this.array.interpret(context);
        if (array.error) return array;

        if (context.has(this.identifier.value) && this.isGlobalId) {
            return new InvalidSyntaxError(this.identifier.pos,
                'Cannot declare global variable which exists in the current scope')
        }

        function iteration (body: Node, id: string, element: Primitive, isGlobal: boolean, isConstant: boolean): 'break' | interpretResult | undefined {
            let newContext = new Context();
            newContext.parent = context;

            newContext.set(id, element, {
                global: isGlobal,
                isConstant,
                type: element.__type__
            });

            const res = body.interpret(newContext);
            if (res.error || (res.funcReturn !== undefined)) return res;
            if (res.shouldBreak) {
                res.shouldBreak = false;
                return 'break';
            }
            if (res.shouldContinue) {
                res.shouldContinue = false;
            }
        }

        if (array.val instanceof ESNumber) {
            for (let i = 0; i < array.val.valueOf(); i++) {
                const res = iteration(this.body, this.identifier.value, new ESNumber(i), this.isGlobalId, this.isConstId);
                if (res === 'break') break;
                if (res && (res.error || (res.funcReturn !== undefined))) return res;
            }

        } else if (array.val instanceof ESObject || array.val instanceof ESJSBinding) {
            for (let element in array.val?.valueOf()) {
                const res = iteration(this.body, this.identifier.value, new ESString(element), this.isGlobalId, this.isConstId);
                if (res === 'break') break;
                if (res && (res.error || (res.funcReturn !== undefined))) return res;
            }

        } else if (array.val instanceof ESArray) {
            for (let element of array.val?.valueOf()) {
                const res = iteration(this.body, this.identifier.value, element, this.isGlobalId, this.isConstId);
                if (res === 'break') break;
                if (res && (res.error || (res.funcReturn !== undefined))) return res;
            }
        } else if (array.val instanceof ESString) {
            for (let element of array.val?.valueOf()) {
                const res = iteration(this.body, this.identifier.value, new ESString(element), this.isGlobalId, this.isConstId);
                if (res === 'break') break;
                if (res && (res.error || (res.funcReturn !== undefined))) return res;
            }
        } else
            return new TypeError(
                this.identifier.pos,
                'Array | Number | Object | String',
                typeof array.val
            );

        return new interpretResult(new ESUndefined());
    }

    compileJS (config: compileConfig) {

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
            return new compileResult(`for(${declaration} ${this.identifier.value} of ${iteratorRes.val}){${bodyRes.val}\n${indent}}`);
        }

        return new compileResult(`for (${declaration} ${this.identifier.value} of ${iteratorRes.val}) {\n${bodyRes.val}\n${indent}}`);
    }

    compilePy (config: compileConfig) {
        const res = new compileResult;

        config.indent += 4;

        const iteratorRes = res.register(this.array, config);
        if (res.error) return res;

        const bodyRes = res.register(this.body, config);
        if (res.error) return res;

        // if it is global then defined it at the top
        if (this.isGlobalId) {
            res.hoisted += `${this.identifier.value}=None`;
        }

        res.val = `for ${this.identifier.value} in ${iteratorRes}:\n${bodyRes}`;

        return res;
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
        let result = new interpretResult();
        let interpreted: Primitive[] = [];

        for (let item of this.items) {
            const res = item.interpret(context);
            if (res.error || (res.funcReturn !== undefined)) return res;
            if (!res.val) continue;
            let val = res.val;
            if (this.shouldClone) {
                val = val.clone();
            }
            interpreted.push(val);
        }

        result.val = new ESArray(interpreted);

        return result;
    }

    compileJS (config: compileConfig) {
        const res = new compileResult('[');
        for (let item of this.items) {
            const itemRes = item.compileJS(config);
            if (itemRes.error) return itemRes;
            res.val += itemRes.val + ',';
        }
        res.val += ']';
        return res;
    }

    compilePy (config: compileConfig) {
        const res = new compileResult('[');
        for (let item of this.items) {
            const itemRes = res.register(item, config);
            if (res.error) return res;
            res.val += itemRes + ',';
        }
        res.val += ']';
        return res;
    }
}

export class N_objectLiteral extends Node {
    properties: [Node, Node][];
    constructor(pos: Position, properties: [Node, Node][]) {
        super(pos);
        this.properties = properties;
    }

    interpret_ (context: Context): interpretResult | ESError {
        let interpreted: dict<Primitive> = {};

        for (const [keyNode, valueNode] of this.properties) {
            const value = valueNode.interpret(context);
            if (value.error) return value.error;

            const key = keyNode.interpret(context);
            if (key.error) return key.error;

            if (key.val && value.val) {
                interpreted[key.val.valueOf()] = value.val;
            }
        }

        return new interpretResult(new ESObject(interpreted));
    }

    compileJS (config: compileConfig) {
        const res = new compileResult('{');
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

    compilePy (config: compileConfig) {
        const res = new compileResult('{');
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
}

export class N_statements extends Node {

    items: Node[];
    topLevel: boolean;

    constructor(pos: Position, items: Node[], topLevel=false) {
        super(pos);
        this.items = items;
        this.topLevel = topLevel;
    }

    interpret_ (context: Context): ESError | interpretResult {
        if (!this.topLevel) {
            let last;
            for (let item of this.items) {
                const res = item.interpret(context);
                if (res.error || (typeof res.funcReturn !== 'undefined') || res.shouldBreak || res.shouldContinue)
                    return res;
                // return last statement
                last = res.val;
            }

            return new interpretResult(last || new ESUndefined());
        } else {
            let result = new interpretResult();
            let interpreted: Primitive[] = [];

            for (let item of this.items) {
                const res = item.interpret(context);
                if (res.error || (res.funcReturn !== undefined)) return res;
                if (!res.val) continue;
                let val = res.val.clone();
                interpreted.push(val);
            }

            result.val = new ESArray(interpreted);

            return result;
        }
    }

    compileJS (config: compileConfig) {
        const res = new compileResult;

        const indent = ' '.repeat(config.indent);

        res.val += indent;

        for (let item of this.items) {

            const itemRes = item.compileJS(config);
            if (itemRes.error) return itemRes;
            res.val += itemRes.val + ';';

            if (!config.minify) {
                res.val += '\n' + indent;
            }
        }
        return res;
    }

    compilePy (config: compileConfig) {
        const res = new compileResult;

        const indent = ' '.repeat(config.indent);


        res.val += indent;

        for (let item of this.items) {

            const itemRes = res.register(item, config);
            if (res.error) return res;

            res.val += itemRes;
            res.val += '\n' + indent;
        }
        return res;
    }
}

export class N_functionCall extends Node {
    arguments: Node[];
    to: Node;

    constructor(pos: Position, to: Node, args: Node[]) {
        super(pos);
        this.arguments = args;
        this.to = to;
    }

    interpret_ (context: Context): ESError | interpretResult {
        let { val, error } = this.to.interpret(context);
        if (error) {
            return error;
        }
        if (!val) {
            return new TypeError(this.pos, 'any', 'undefined', undefined, 'On function call');
        }

        let params: Primitive[] = [];

        for (let arg of this.arguments) {
            const res = arg.interpret(context);
            if (res.error) {
                return res.error;
            }
            if (res.val) {
                params.push(res.val);
            }
        }

        const res = val.__call__({context}, ...params);

        if (res instanceof ESError) {
            res.traceback.push({
                position: this.pos,
                // do the best we can to recreate line,
                // giving some extra info as well as it is the interpreted arguments so
                // variables values not names
                line: `${val.info.name || '<AnonFunction>'}(${params.map(str).join(', ')})`
            });
        }

        return new interpretResult(res);
    }

    compileJS (config: compileConfig) {
        const res = new compileResult;

        const funcRes = this.to.compileJS(config);
        if (funcRes.error) return funcRes;
        res.val = funcRes.val + '(';

        for (let arg of this.arguments) {
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

    compilePy (config: compileConfig) {
        const res = new compileResult;

        const funcRes = res.register(this.to, config);
        if (res.error) return res;
        res.val = funcRes + '(';

        for (let arg of this.arguments) {
            const argRes = res.register(arg, config);
            if (res.error) return res;
            res.val += argRes;
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
}

export class N_functionDefinition extends Node {
    body: Node;
    arguments: uninterpretedArgument[];
    name: string;
    this_: ESObject;
    returnType: Node;
    description: string;
    isDeclaration = false;

    constructor(
        pos: Position,
        body: Node,
        argNames: uninterpretedArgument[],
        returnType: Node,
        name = '(anon)',
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

    interpret_ (context: Context): interpretResult | ESError {

        let args: runtimeArgument[] = [];
        for (let arg of this.arguments) {
            const res = interpretArgument(arg, context);
            if (res instanceof ESError)
                return res;
            args.push(res);
        }
        const returnTypeRes = this.returnType.interpret(context);
        if (returnTypeRes.error) return returnTypeRes.error;

        let funcPrim = new ESFunction(this.body, args, this.name, this.this_, returnTypeRes.val, context);

        if (this.isDeclaration) {
            if (context.hasOwn(this.name)) {
                return new InvalidSyntaxError(Position.void, `Cannot redeclare symbol '${this.name}'`);
            }

            context.setOwn(this.name, funcPrim, {
                isConstant: true,
                type: types.function
            });
        }

        return new interpretResult(funcPrim);
    }

    compileJS (config: compileConfig) {
        const res = new compileResult('function(');

        for (let param of this.arguments) {
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
        res.val += `${bodyRes.val}\n${indent}}`;
        return res;
    }

    compilePy (config: compileConfig) {
        const res = new compileResult;

        const hoistedName = generateRandomSymbol(config.symbols);

        res.hoisted = `def ${hoistedName}(`;

        for (let param of this.arguments) {
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
}

export class N_return extends Node {
    value: Node | undefined;
    constructor(pos: Position, value: Node | undefined) {
        super(pos);
        this.value = value;
    }

    interpret_ (context: Context) {
        const res = new interpretResult();

        if (this.value === undefined)  {
            res.funcReturn = new ESUndefined();
            return res;
        }

        let val = this.value.interpret(context);
        if (val.error) return val.error;

        res.funcReturn = val.val;
        return res;
    }

    compileJS (config: compileConfig): compileResult {
        const valRes = this.value?.compileJS(config);
        if (valRes?.error) return valRes;
        return new compileResult(`return(${valRes?.val})`);
    }

    compilePy (config: compileConfig): compileResult {
        const res = new compileResult;
        if (!this.value) {
            return new compileResult('return');
        }
        const valRes = res.register(this.value, config);
        if (res.error) return res;
        return new compileResult(`return ${valRes}`);
    }
}

export class N_yield extends Node {
    value: Node | undefined;
    constructor(pos: Position, value: Node | undefined) {
        super(pos);
        this.value = value;
    }

    interpret_ (context: Context) {
        const res = new interpretResult();

        if (this.value === undefined)  {
            res.funcReturn = new ESUndefined();
            return res;
        }

        let val = this.value.interpret(context);
        if (val.error) return val.error;

        if (val.val?.bool().valueOf()) {
            res.funcReturn = val.val;
        }

        return res;
    }

    compileJS (config: compileConfig): compileResult {
        const valRes = this.value?.compileJS(config);
        if (!valRes || !valRes.val) {
            return new compileResult('');
        }
        return new compileResult(`if(_=${valRes.val}){return(_))`);
    }

    compilePy (config: compileConfig): compileResult {
        if (!this.value) {
            return new compileResult('');
        }

        const res = new compileResult;
        const valRes = res.register(this.value, config);
        if (!valRes) {
            return new compileResult('');
        }
        return new compileResult(`if _ := ${valRes}: return _`);
    }
}

export class N_indexed extends Node {
    base: Node;
    index: Node;
    // not undefined if setting value
    value: Node | undefined;
    assignType: string | undefined;

    constructor(pos: Position, base: Node, index: Node) {
        super(pos);
        this.base = base;
        this.index = index;
    }

    interpret_ (context: Context): ESError | interpretResult {
        let baseRes = this.base.interpret(context);
        if (baseRes.error) return baseRes;

        let indexRes = this.index.interpret(context);
        if (indexRes.error) return indexRes;

        const index = indexRes.val;
        const base = baseRes.val;

        if (!base || !index) {
            return new interpretResult(new ESUndefined());
        }

        if (this.value !== undefined) {
            let valRes = this.value.interpret(context);
            if (valRes.error) return valRes;

            const currentVal = wrap(base.__get_property__({context}, index));
            let newVal: Primitive | ESError;
            let assignVal = valRes.val;
            this.assignType ??= '=';

            if (!assignVal) {
                return new TypeError(this.pos,
                    '~undefined', 'undefined', 'undefined', 'N_indexed.interpret_')
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
                    return new ESError(
                        this.pos,
                        'AssignError',
                        `Cannot find assignType of ${this.assignType[0]}`
                    );
            }

            if (newVal instanceof ESError)
                return newVal;

            if (!base.__set_property__)
                return new TypeError(this.pos,
                    'mutable', 'immutable', base.valueOf());

            const res = base.__set_property__({context}, index, newVal ?? new ESUndefined());
            if (res instanceof ESError)
                return res;
        }
        return new interpretResult(base.__get_property__({context}, index));
    }

    compileJS (config: compileConfig) {
        const objectRes = this.base.compileJS(config);
        if (objectRes.error) return objectRes;

        const keyRes = this.index.compileJS(config);
        if (keyRes.error) return keyRes;

        if (!this.value) {
            return new compileResult(`${objectRes.val}[${keyRes.val}]`);
        }

        const valRes = this.value.compileJS(config);
        if (valRes.error) return valRes;

        return new compileResult(`${objectRes.val}[${keyRes.val}]${this.assignType||'='}${valRes.val}`);
    }

    compilePy (config: compileConfig): compileResult {
        const res = new compileResult;
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
}

export class N_class extends Node {

    init: N_functionDefinition | undefined;
    methods: N_functionDefinition[];
    name: string;
    extends_?: Node;
    isDeclaration: boolean;

    constructor(pos: Position, methods: N_functionDefinition[], extends_?: Node, init?: N_functionDefinition, name = '<anon class>', isDeclaration=false) {
        super(pos);
        this.init = init;
        this.methods = methods;
        this.name = name;
        this.extends_ = extends_;
        this.isDeclaration = isDeclaration;
    }

    interpret_ (context: Context): interpretResult | ESError {
        const methods: ESFunction[] = [];
        for (let method of this.methods) {
            const res = method.interpret(context);
            if (res.error) {
                return res.error;
            }
            if (!(res.val instanceof ESFunction)) {
                return new TypeError(
                    this.pos,
                    'Function',
                    res.val?.typeName().valueOf() || 'undefined',
                    'method on ' + this.name
                );
            }
            methods.push(res.val);
        }
        let extends_: ESType = types.object;
        if (this.extends_) {
            const extendsRes = this.extends_.interpret(context);
            if (extendsRes.error) {
                return extendsRes.error;
            }
            if (!(extendsRes.val instanceof ESType)) {
                return new TypeError(
                    this.pos,
                    'Type',
                    extendsRes.val?.typeName().valueOf() || 'undefined',
                    'method on ' + this.name
                );
            }
            extends_ = extendsRes.val;
        }
        let init;
        if (this.init) {
            const initRes = this.init.interpret(context);
            if (initRes.error) {
                return initRes.error;
            }
            if (!(initRes.val instanceof ESFunction)) {
                return new TypeError(
                    this.pos,
                    'Function',
                    initRes.val?.typeName().valueOf() || 'undefined',
                    'method on ' + this.name
                );
            }
            init = initRes.val;
        }

        let typePrim = new ESType(false, this.name, methods, extends_, init)

        if (this.isDeclaration) {
            if (context.hasOwn(this.name)) {
                return new InvalidSyntaxError(Position.void, `Cannot redeclare symbol '${this.name}'`);
            }

            context.setOwn(this.name, typePrim, {
                isConstant: true,
                type: types.type
            });
        }

        return new interpretResult(typePrim);
    }

    compileJS (config: compileConfig) {
        return new compileResult('function(){return{};}');
    }

    compilePy (config: compileConfig) {
        return new compileResult(`class ${this.name}:\n${' '.repeat(config.indent)}pass`);
    }
}

export class N_namespace extends Node {

    public name: string;
    private readonly statements: Node;
    public mutable: boolean;
    private readonly isDeclaration: boolean;

    constructor (pos: Position, statements: Node, name = '(anon)', mutable=false, isDeclaration=false) {
        super(pos);
        this.name = name;
        this.statements = statements;
        this.mutable = mutable;
        this.isDeclaration = isDeclaration;
    }

    interpret_ (context: Context): ESError | interpretResult {
        const newContext = new Context();
        newContext.parent = context;

        const res = this.statements.interpret(newContext);
        if (res.error) return res;

        let n = new ESNamespace(new ESString(this.name), newContext.getSymbolTableAsDict(), this.mutable);

        if (this.isDeclaration) {
            if (context.hasOwn(this.name)) {
                return new InvalidSyntaxError(Position.void, `Cannot redeclare symbol '${this.name}'`);
            }

            context.setOwn(this.name, n);
        }

        return new interpretResult(n);
    }

    compileJS (config: compileConfig) {
        const bodyRes = this.statements.compileJS(config);
        if (bodyRes.error) return bodyRes;

        return new compileResult(`(() => {${bodyRes.val}})()`);
    }

    compilePy (config: compileConfig) {
        const res = new compileResult;
        const bodyRes = res.register(this.statements, config);
        if (res.error) return res;

        res.val = `'namespace'`;
        return res;
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

    interpret_ (context: Context): ESError | interpretResult {
        const res = this.body.interpret(context);

        if (res.error) {
            const newContext = new Context();
            newContext.parent = context;
            newContext.setOwn(catchBlockErrorSymbolName, new ESErrorPrimitive(res.error), {
                isConstant: true
            });
            const catchRes = this.catchBlock.interpret(newContext);
            if (catchRes.error) return catchRes.error;
        }

        return new interpretResult();
    }

    compileJS (config: compileConfig) {
        const bodyRes = this.body.compileJS(config);
        if (bodyRes.error) return bodyRes;

        const catchRes = this.catchBlock.compileJS(config);
        if (catchRes.error) return catchRes;

        return new compileResult(`try{${bodyRes.val}}catch(${catchBlockErrorSymbolName}){${catchRes.val}}`);
    }

    compilePy (config: compileConfig) {
        const res = new compileResult;

        const bodyRes = res.register(this.body, config);
        if (res.error) return res;

        const catchRes = res.register(this.catchBlock, config);
        if (res.error) return res;

        const indent = ' '.repeat(config.indent);
        const highIndent = ' '.repeat(config.indent + 1);

        res.val = `try:\n${highIndent}${bodyRes}\n${indent}except:\n${highIndent}${catchRes}`;
        return res;
    }
}

// --- TERMINAL NODES ---
export class N_number extends Node {
    a: Token<number>;
    constructor(pos: Position, a: Token<number>) {
        super(pos, true);
        this.a = a;
    }
    interpret_ (context: Context): interpretResult | ESError {
        let val = this.a.value;

        const res = new interpretResult();
        res.val = new ESNumber(val);
        return res;
    }

    compileJS (config: compileConfig) {
        return new compileResult(this.a.value.toString());
    }

    compilePy (config: compileConfig) {
        return new compileResult(this.a.value.toString());
    }
}

export class N_string extends Node {
    a: Token<string>;
    constructor (pos: Position, a: Token<string>) {
        super(pos, true);
        this.a = a;
    }
    interpret_ (context: Context): interpretResult | ESError {
        let val = this.a.value;

        const res = new interpretResult();
        res.val = new ESString(val);
        return res;
    }

    compileJS (config: compileConfig) {
        return new compileResult(`'${this.a.value}'`);
    }

    compilePy (config: compileConfig) {
        return new compileResult(`'${this.a.value}'`);
    }
}

export class N_variable extends Node {

    a: Token<string>;

    constructor(a: Token<string>) {
        super(a.pos, true);
        this.a = a;
    }

    interpret_ (context: Context): ESError | interpretResult {
        if (!context.has(this.a.value)) {
            return new ReferenceError(this.a.pos, this.a.value);
        }

        let res = new interpretResult();
        let symbol = context.getSymbol(this.a.value);

        if (!symbol) {
            return new ReferenceError(this.pos, `No access to undeclared variable ${this.a.value}`);
        }
        if (symbol instanceof ESError) {
            return symbol;
        }

        res.val = symbol.value;

        return res;
    }

    compileJS (config: compileConfig) {
        let val = this.a.value.toString();
        if (val === 'import') {
            val = 'import_';
        }
        return new compileResult(val);
    }

    compilePy (config: compileConfig): compileResult {
        let val = this.a.value.toString();
        if (val === 'import') {
            val = 'import_';
        }
        return new compileResult(val);
    }
}

export class N_undefined extends Node {

    constructor(pos = Position.void) {
        super(pos, true);
    }

    interpret_ (context: Context) {
        const res = new interpretResult();
        res.val = new ESUndefined();
        return res;
    }

    compileJS (config: compileConfig) {
        return new compileResult('undefined');
    }

    compilePy (config: compileConfig) {
        return new compileResult('None');
    }
}

export class N_break extends Node {
    constructor(pos: Position) {
        super(pos, true);
    }

    interpret_ (context: Context) {
        const res = new interpretResult();
        res.shouldBreak = true;
        return res;
    }

    compileJS (config: compileConfig) {
        return new compileResult('break');
    }

    compilePy (config: compileConfig) {
        return new compileResult('break');
    }
}
export class N_continue extends Node {
    constructor(pos: Position) {
        super(pos, true);
    }

    interpret_ (context: Context) {
        const res = new interpretResult();
        res.shouldContinue = true;
        return res;
    }

    compileJS (config: compileConfig) {
        return new compileResult('continue');
    }

    compilePy (config: compileConfig) {
        return new compileResult('continue');
    }
}

export class N_primitiveWrapper extends Node {
    value: Primitive;

    constructor(val: Primitive, pos = Position.void) {
        super(pos, true);
        this.value = val;
    }

    public interpret_(context: Context): interpretResult {
        return new interpretResult(this.value);
    }

    compileJS (config: compileConfig) {
        return new compileResult(JSON.stringify(this.value.valueOf()));
    }

    compilePy (config: compileConfig) {
        return new compileResult(JSON.stringify(this.value.valueOf()));
    }
}