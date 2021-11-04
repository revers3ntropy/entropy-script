import { tokenTypeString, tt } from "./tokens.js";
import {Token} from "./tokens.js";
import {ESError, InvalidSyntaxError, ReferenceError, TypeError} from "./errors.js";
import { Context } from "./context.js";
import {Position} from "./position.js";
import {None, now} from "./constants.js";
import { interpretArgument, runtimeArgument, uninterpretedArgument } from "./argument.js";
import {
    ESArray,
    ESBoolean,
    ESFunction,
    ESNumber,
    ESObject,
    ESPrimitive,
    ESString,
    ESType,
    ESUndefined,
    Primitive,
    types
} from "./primitiveTypes.js";
import { dict, str } from "./util.js";

export class interpretResult {
    val: Primitive | undefined;
    error: ESError | undefined;
    funcReturn: Primitive | undefined;
    shouldBreak = false;
    shouldContinue = false;
}

export abstract class Node {
    startPos: Position;
    isTerminal;

    static interprets = 0;
    static totalTime = 0;
    static maxTime = 0;


    protected constructor (startPos: Position, isTerminal=false) {
        this.startPos = startPos;
        this.isTerminal = isTerminal;
    }
    abstract interpret_ (context: Context): ESError | Primitive | interpretResult;

    interpret (context: Context): interpretResult {
        const start = now();
        const res = new interpretResult();
        const val = this.interpret_(context);

        if (val instanceof ESError)
            res.error = val;

        else if (val instanceof interpretResult) {
            res.val = val.val;
            res.error = val.error;
            res.funcReturn = val.funcReturn;
            res.shouldBreak = val.shouldBreak;
            res.shouldContinue = val.shouldContinue;

        } else
            res.val = val;

        let time = now() - start;
        Node.interprets++;
        Node.totalTime += time;
        if (time > Node.maxTime) Node.maxTime = time;
        return res;
    }
}


// --- NON-TERMINAL NODES ---

export class N_binOp extends Node {
    left: Node;
    right: Node;
    opTok: Token;

    constructor (startPos: Position, left: Node, opTok: Token, right: Node) {
        super(startPos);
        this.left = left;
        this.opTok = opTok;
        this.right = right;
    }

     interpret_(context: Context): ESError | Primitive {
        const left = this.left.interpret(context);
        const right = this.right.interpret(context);

        if (left.error) return left.error;
        if (right.error) return right.error;

        const l = left.val;
        const r = right.val;
        if (typeof l === 'undefined')
            return new TypeError(this.opTok.startPos, '~undefined', 'undefined', l, 'N_binOp.interpret_');

        if (typeof r === 'undefined')
            return new TypeError(this.opTok.startPos, '~undefined', 'undefined', r, 'N_binOp.interpret_');

        function declaredBinOp (l: Primitive, r: Primitive, fnName: string, opTokPos: Position): ESError | Primitive {
            if (!(l instanceof ESPrimitive) || !(r instanceof ESPrimitive) || !l.hasProperty(new ESString(fnName)))
                return new TypeError(opTokPos, 'unknown', l?.typeOf().valueOf(), l?.valueOf(), `Unsupported operand for ${fnName}`);

            // @ts-ignore
            return l[fnName](r);
        }

        switch (this.opTok.type) {
            case tt.LTE: {
                const lt = declaredBinOp(l, r, '__lt__', this.opTok.startPos);
                const eq = declaredBinOp(l, r, '__eq__', this.opTok.startPos);
                if (lt instanceof ESError) return lt;
                if (eq instanceof ESError) return eq;
                return declaredBinOp(lt, eq, '__or__', this.opTok.startPos);

            } case tt.GTE: {
                const gt = declaredBinOp(l, r, '__gt__', this.opTok.startPos);
                const eq = declaredBinOp(l, r, '__eq__', this.opTok.startPos);
                if (gt instanceof ESError) return gt;
                if (eq instanceof ESError) return eq;
                return declaredBinOp(gt, eq, '__or__', this.opTok.startPos);

            } case tt.NOTEQUALS: {
                const res = declaredBinOp(l, r, '__eq__', this.opTok.startPos);
                if (res instanceof ESError) return res;
                return new ESBoolean(!res.bool().valueOf());

            } case tt.ADD:
                return declaredBinOp(l, r, '__add__', this.opTok.startPos);
            case tt.SUB:
                return declaredBinOp(l, r, '__subtract__', this.opTok.startPos);
            case tt.MUL:
                return declaredBinOp(l, r, '__multiply__', this.opTok.startPos);
            case tt.DIV:
                return declaredBinOp(l, r, '__divide__', this.opTok.startPos);
            case tt.POW:
                return declaredBinOp(l, r, '__pow__', this.opTok.startPos);
            case tt.EQUALS:
                return declaredBinOp(l, r, '__eq__', this.opTok.startPos);
            case tt.LT:
                return declaredBinOp(l, r, '__lt__', this.opTok.startPos);
            case tt.GT:
                return declaredBinOp(l, r, '__gt__', this.opTok.startPos);
            case tt.AND:
                return declaredBinOp(l, r, '__and__', this.opTok.startPos);
            case tt.OR:
                return declaredBinOp(l, r, '__or__', this.opTok.startPos);

            default:
                return new InvalidSyntaxError(
                    this.opTok.startPos,
                    `Invalid binary operator: ${tokenTypeString[this.opTok.type]}`
                );
        }
    }
}

export class N_unaryOp extends Node {
    a: Node;
    opTok: Token;

    constructor (startPos: Position, a: Node, opTok: Token) {
        super(startPos);
        this.a = a;
        this.opTok = opTok;
    }

    interpret_(context: Context): ESError | Primitive {
        const res = this.a.interpret(context);
        if (res.error) return res.error;

        switch (this.opTok.type) {
            case tt.SUB:
            case tt.ADD:
                if (!(res.val instanceof ESNumber))
                    return new TypeError(this.startPos, 'Number', res.val?.typeOf().toString() || 'undefined_', res.val?.valueOf());
                const numVal = res.val.valueOf();
                return new ESNumber(this.opTok.type === tt.SUB ? -numVal : Math.abs(numVal));
            case tt.NOT:
                return new ESBoolean(!res?.val?.bool().valueOf());
            default:
                return new InvalidSyntaxError(
                    this.opTok.startPos,
                    `Invalid unary operator: ${tokenTypeString[this.opTok.type]}`
                );
        }
    }
}

export class N_varAssign extends Node {
    value: Node;
    varNameTok: Token;
    isGlobal: boolean;
    isConstant: boolean;
    assignType: string;
    type: Node;

    constructor (
        startPos: Position,
        varNameTok: Token, value: Node,
        assignType='=',
        isGlobal=false,
        isConstant=false,
        type: ESType | Node = types.any
    ) {
        super(startPos);
        this.value = value;
        this.varNameTok = varNameTok;
        this.isGlobal = isGlobal;
        this.assignType = assignType;
        this.isConstant = isConstant;

        if (type instanceof ESType) {
            // wrap raw ESType in node
            this.type = new N_any(type);
        } else this.type = type;
    }

    interpret_(context: Context): interpretResult | ESError | Primitive {
        const res = this.value.interpret(context);
        const typeRes = this.type.interpret(context);

        if (res.error) return res.error;
        if (typeRes.error) return typeRes.error;

        if (!typeRes.val || !(typeRes.val instanceof ESType))
            return new TypeError(this.varNameTok.startPos, 'Type',
                typeRes.val?.typeOf().valueOf() ?? 'undefined', typeRes.val?.str(), `@ !typeRes.val || !(typeRes.val instanceof ESType)`);

        if (!res.val)
            return new TypeError(this.varNameTok.startPos, '~undefined', 'undefined', 'N_varAssign.interpret_');

        if (!typeRes.val.includesType(res.val.__type__))
            return new TypeError(this.varNameTok.startPos,
                typeRes.val.str().valueOf() ?? 'unknown type',
                res.val?.typeOf().valueOf() ?? 'undefined__',
                res.val?.str());

        if (this.assignType === '=') {
            // simple assign
            let value = res.val;
            if (value === undefined)
                value = new ESUndefined();

            const setRes = context.set(this.varNameTok.value, value, {
                global: this.isGlobal,
                isConstant: this.isConstant
            });
            if (setRes instanceof ESError) return setRes;


        } else {
            // assign with modifier like *= or -=
            const currentVal = context.get(this.varNameTok.value)?.valueOf();
            if (currentVal instanceof ESError) return currentVal;
            let newVal;
            let assignVal = res.val?.valueOf();

            switch (this.assignType[0]) {
                case '*':
                    newVal = currentVal * assignVal;
                    break;
                case '/':
                    newVal = currentVal / assignVal;
                    break;
                case '+':
                    newVal = currentVal + assignVal;
                    break;
                case '-':
                    newVal = currentVal - assignVal;
                    break;

                default:
                    return new ESError(
                        this.startPos,
                        'AssignError',
                        `Cannot find assignType of ${this.assignType[0]}`
                    );
            }

            let setRes = context.set(this.varNameTok.value, newVal, {
                global: this.isGlobal,
                isConstant: this.isConstant
            });
            if (setRes instanceof ESError) return setRes;
            res.val = ESPrimitive.wrap(newVal);
        }
        return res;
    }
}

export class N_if extends Node {
    comparison: Node;
    ifTrue: Node;
    ifFalse: Node | undefined;

    constructor (startPos: Position, comparison: Node, ifTrue: Node, ifFalse: Node | undefined) {
        super(startPos);
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
            res = this.ifTrue.interpret(newContext);
            // so that if statements always return a value of None
            res.val = new ESUndefined();
            if (res.error) return res;

        } else if (this.ifFalse) {
            res = this.ifFalse.interpret(newContext);
            // so that if statements always return a value of None
            res.val = new ESUndefined();
            if (res.error) return res;
        }

        return res;
    }
}

export class N_while extends Node {
    comparison: Node;
    loop: Node;

    constructor (startPos: Position, comparison: Node, loop: Node) {
        super(startPos);
        this.comparison = comparison;
        this.loop = loop;
    }

    interpret_(context: Context) {
        let newContext = new Context();
        newContext.parent = context;

        while (true) {
            let shouldLoop = this.comparison.interpret(context);
            if (shouldLoop.error) return shouldLoop;

            if (!shouldLoop.val?.bool()?.valueOf()) break;

            let potentialError = this.loop.interpret(newContext)
            if (potentialError.error) return potentialError;
            if (potentialError.shouldBreak) break;
        }
        return new ESUndefined();
    }
}

export class N_for extends Node {
    array: Node;
    body: Node;
    identifier: Token;
    isGlobalId: boolean;
    isConstId: boolean;

    constructor (startPos: Position, body: Node, array: Node, identifier: Token, isGlobalIdentifier: boolean, isConstIdentifier: boolean) {
        super(startPos);
        this.body = body;
        this.array = array;
        this.identifier = identifier;
        this.isGlobalId = isGlobalIdentifier;
        this.isConstId = isConstIdentifier;
    }

    interpret_ (context: Context) {
        let newContext = new Context();
        newContext.parent = context;
        let res: any = None;

        const array = this.array.interpret(context);
        if (array.error) return array;

        if (!['Array', 'Number', 'Object', 'String', 'Any'].includes(array.val?.typeOf().valueOf() || ''))
            return new TypeError(
                this.identifier.startPos,
                'Array | Number | Object | String',
                typeof array.val + ' | ' + array.val?.typeOf()
            );

        function iteration (body: Node, id: string, element: Primitive, isGlobal: boolean, isConstant: boolean): 'break' | interpretResult | undefined {
            newContext.set(id, element, {
                global: isGlobal,
                isConstant
            });

            res = body.interpret(newContext);
            if (res.error || (res.funcReturn !== undefined)) return res;
            if (res.shouldBreak) {
                res.shouldBreak = false;
                return 'break';
            }
            if (res.shouldContinue)
                res.shouldContinue = false;
        }

        if (array.val instanceof ESNumber || typeof array.val?.valueOf() == 'number') {
            for (let i = 0; i < array.val.valueOf(); i++) {
                const res = iteration(this.body, this.identifier.value, new ESNumber(i), this.isGlobalId, this.isConstId);
                if (res === 'break') break;
                if (res && (res.error || (res.funcReturn !== undefined))) return res;
            }

        } else if (array.val instanceof ESObject ||
            (typeof array.val?.valueOf() == 'number' && !Array.isArray(array.val?.valueOf()))
        ) {
            for (let element in array.val?.valueOf()) {
                const res = iteration(this.body, this.identifier.value, new ESString(element), this.isGlobalId, this.isConstId);
                if (res === 'break') break;
                if (res && (res.error || (res.funcReturn !== undefined))) return res;
            }
        } else if (array.val instanceof ESArray || Array.isArray(array.val?.valueOf())) {
            for (let element of array.val?.valueOf()) {
                const res = iteration(this.body, this.identifier.value, element, this.isGlobalId, this.isConstId);
                if (res === 'break') break;
                if (res && (res.error || (res.funcReturn !== undefined))) return res;
            }
        } else
            return new TypeError(
                this.identifier.startPos,
                'Array | Number | Object | String',
                typeof array.val
            );

        return new ESUndefined();
    }
}

export class N_array extends Node {
    items: Node[];
    shouldClone: boolean;
    constructor(startPos: Position, items: Node[], shouldClone=false) {
        super(startPos);
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
            if (this.shouldClone)
                val = val.clone();
            interpreted.push(val);
            if (!(val instanceof ESPrimitive))
                console.log('NOT INSTANCE: ', str(val));
        }


        result.val = new ESArray(interpreted);

        return result;
    }
}

export class N_objectLiteral extends Node {
    properties: [Node, Node][];
    constructor(startPos: Position, properties: [Node, Node][]) {
        super(startPos);
        this.properties = properties;
    }

    interpret_ (context: Context): Primitive | ESError {
        let interpreted: dict<Primitive> = {};

        for (const [keyNode, valueNode] of this.properties) {
            const value = valueNode.interpret(context);
            if (value.error) return value.error;

            const key = keyNode.interpret(context);
            if (key.error) return key.error;

            if (key.val && value.val)
                interpreted[key.val.valueOf()] = value.val;
        }

        return new ESObject(interpreted);
    }
}

export class N_emptyObject extends Node {
    constructor(startPos: Position) {
        super(startPos);
    }

    interpret_ (context: Context) {
        return new ESObject({});
    }
}

export class N_statements extends Node {
    items: Node[];
    constructor(startPos: Position, items: Node[]) {
        super(startPos);
        this.items = items;
    }

    interpret_ (context: Context) {
        let last;
        for (let item of this.items) {
            const res = item.interpret(context);
            if (res.error || (typeof res.funcReturn !== 'undefined') || res.shouldBreak || res.shouldContinue)
                return res;
            // return last statement
            last = res.val;
        }

        if (last) return last;
        return new ESUndefined();
    }
}

export class N_functionCall extends Node {
    arguments: Node[];
    to: Node;

    constructor(startPos: Position, to: Node, args: Node[]) {
        super(startPos);
        this.arguments = args;
        this.to = to;
    }

    interpret_ (context: Context) {
        let { val, error } = this.to.interpret(context);
        if (error) return error;
        if (!val)
            return new TypeError(this.startPos, 'any', 'undefined', undefined, 'On function call');
        if (!val.__call__)
            return new TypeError(this.startPos, 'unknown',
                val?.typeOf().valueOf() || 'undefined', val?.valueOf(),
                'Can only () on something with __call__ property');

        let params: Primitive[] = [];

        for (let arg of this.arguments) {
            const res = arg.interpret(context);
            if (res.error)
                return res;
            if (res.val)
                params.push(res.val);
        }

        return val.__call__(params, context);
    }
}

export class N_functionDefinition extends Node {
    body: Node;
    arguments: uninterpretedArgument[];
    name: string;
    this_: any;
    returnType: Node;

    constructor(startPos: Position, body: Node, argNames: uninterpretedArgument[], returnType: Node, name = '(anon)', this_: any = {}) {
        super(startPos);
        this.arguments = argNames;
        this.body = body;
        this.name = name;
        this.this_ = this_;
        this.returnType = returnType;
    }

    interpret_ (context: Context): Primitive | ESError {

        let args: runtimeArgument[] = [];
        for (let arg of this.arguments) {
            const res = interpretArgument(arg, context);
            if (res instanceof ESError)
                return res;
            args.push(res);
        }
        const returnTypeRes = this.returnType.interpret(context);
        if (returnTypeRes.error) return returnTypeRes.error;
        if (!(returnTypeRes.val instanceof ESType))
            return new TypeError(
                this.returnType.startPos,
                'Type',
                returnTypeRes.val?.typeOf().valueOf() ?? '<Undefined>',
                returnTypeRes.val?.str().valueOf(),
                `On func '${this.name }' return type`
            );

        return new ESFunction(this.body, args, this.name, this.this_, returnTypeRes.val);
    }
}

export class N_return extends Node {
    value: Node | undefined;
    constructor(startPos: Position, value: Node | undefined) {
        super(startPos);
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
}

export class N_yield extends Node {
    value: Node | undefined;
    constructor(startPos: Position, value: Node | undefined) {
        super(startPos);
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

        if (val.val?.bool())
            res.funcReturn = val.val;

        return res;
    }
}

export class N_indexed extends Node {
    base: Node;
    index: Node;
    // not undefined if setting value
    value: Node | undefined;
    assignType: string | undefined;

    constructor(startPos: Position, base: Node, index: Node) {
        super(startPos);
        this.base = base;
        this.index = index;
    }

    declaredBinOp (l: Primitive, r: Primitive, fnName: string, opTokPos: Position): ESError | Primitive {
        if (!l.hasProperty(new ESString(fnName)))
            return new ESError(opTokPos, 'TypeError', `Unsupported operand ${fnName} on type ${l.typeOf().valueOf()}`);
        // @ts-ignore
        return l[fnName](r);
    }

    interpret_ (context: Context) {
        let baseRes = this.base.interpret(context);
        if (baseRes.error) return baseRes;

        let indexRes = this.index.interpret(context);
        if (indexRes.error) return indexRes;

        const index = indexRes.val;
        const base = baseRes.val;

        if (!base || !index)
            return new ESUndefined();

        if (this.value !== undefined) {
            let valRes = this.value.interpret(context);
            if (valRes.error) return valRes;

            const currentVal = ESPrimitive.wrap(base.__getProperty__(index));
            let newVal: Primitive | ESError;
            let assignVal = valRes.val;
            this.assignType ??= '=';

            if (!assignVal)
                return new TypeError(this.startPos, '~undefined', 'undefined', 'undefined', 'N_indexed.interpret_')

            switch (this.assignType[0]) {
                case '*':
                    newVal = this.declaredBinOp(currentVal, assignVal, '__multiply__', this.startPos); break;
                case '/':
                    newVal = this.declaredBinOp(currentVal, assignVal, '__divide__', this.startPos); break;
                case '+':
                    newVal = this.declaredBinOp(currentVal, assignVal, '__add__', this.startPos); break;
                case '-':
                    newVal = this.declaredBinOp(currentVal, assignVal, '__subtract__', this.startPos); break;
                case '=':
                    newVal = assignVal; break;

                default:
                    return new ESError(
                        this.startPos,
                        'AssignError',
                        `Cannot find assignType of ${this.assignType[0]}`
                    );
            }

            if (newVal instanceof ESError)
                return newVal;

            if (!base.__setProperty__)
                return new TypeError(this.startPos, 'mutable', 'immutable', base.valueOf());

            const res = base.__setProperty__(index, newVal ?? new ESUndefined());
            if (res instanceof ESError)
                return res;
        }
        return ESPrimitive.wrap(base.__getProperty__(index));
    }
}

export class N_class extends Node {

    init: N_functionDefinition | undefined;
    methods: N_functionDefinition[];
    name: string;
    extends_: Node | undefined;
    instances: any[];

    constructor(startPos: Position, methods: N_functionDefinition[], extends_?: Node, init?: N_functionDefinition, name = '<anon class>') {
        super(startPos);
        this.init = init;
        this.methods = methods;
        this.name = name;
        this.extends_ = extends_;
        this.instances = [];
    }

    interpret_ (context: Context) {
        const methods: ESFunction[] = [];
        for (let method of this.methods) {
            const res = method.interpret(context);
            if (res.error)
                return res.error;
            if (res.val instanceof ESFunction)
                methods.push(res.val);
        }
        let extends_ = undefined;
        if (this.extends_) {
            const extendsRes = this.extends_.interpret(context);
            if (extendsRes.error)
                return extendsRes.error;
            if (extendsRes.val instanceof ESType)
                extends_ = extendsRes.val;
        }
        let init = undefined;
        if (this.init) {
            const initRes = this.init.interpret(context);
            if (initRes.error)
                return initRes.error;
            if (initRes.val instanceof ESFunction)
                init = initRes.val;
        }

        return new ESType(false, this.name, methods, extends_, init);
    }
}

// --- TERMINAL NODES ---
export class N_number extends Node {
    a: Token;
    constructor(startPos: Position, a: Token) {
        super(startPos, true);
        this.a = a;
    }
    interpret_ (context: Context): interpretResult | ESError {
        let val = this.a.value;

        if (typeof val !== 'number') return new TypeError(
            this.startPos,
            'number',
            typeof val
        );

        const res = new interpretResult();
        res.val = new ESNumber(val);
        return res;
    }
}

export class N_string extends Node {
    a: Token;
    constructor (startPos: Position, a: Token) {
        super(startPos, true);
        this.a = a;
    }
    interpret_ (context: Context): interpretResult | ESError {
        let val = this.a.value;

        if (typeof val !== 'string') return new TypeError(
            this.startPos,
            'string',
            typeof val
        );

        const res = new interpretResult();
        res.val = new ESString(val);
        return res;
    }
}

export class N_variable extends Node {
    a: Token;
    constructor(a: Token) {
        super(a.startPos, true);
        this.a = a;
    }

    interpret_ (context: Context) {
        if (!context.has(this.a.value))
            return new ReferenceError(this.a.startPos, this.a.value);

        let res = new interpretResult();
        let symbol = context.getSymbol(this.a.value);

        if (!symbol)
            return new ESUndefined();
        if (symbol instanceof ESError)
            return symbol;

        res.val = symbol.value;

        return res;
    }
}

export class N_undefined extends Node {

    constructor(startPos = Position.unknown) {
        super(startPos, true);
    }

    interpret_ (context: Context) {
        const res = new interpretResult();
        res.val = new ESUndefined();
        return res;
    }
}

export class N_break extends Node {
    constructor(startPos: Position) {
        super(startPos, true);
    }

    interpret_ (context: Context) {
        const res = new interpretResult();
        res.shouldBreak = true;
        return res;
    }
}
export class N_continue extends Node {
    constructor(startPos: Position) {
        super(startPos, true);
    }

    interpret_ (context: Context) {
        const res = new interpretResult();
        res.shouldContinue = true;
        return res;
    }
}

export class N_any extends Node {
    val: any;
    constructor(value: any, startPos = Position.unknown) {
        super(startPos, true);
        this.val = value;
    }

    interpret_ (context: Context) {
        if (this.val instanceof ESPrimitive)
            return this.val;
        return ESPrimitive.wrap(this.val);
    }
}