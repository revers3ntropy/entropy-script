import {Token} from "../parse/tokens";
import {ESError, InvalidSyntaxError, ReferenceError, TypeError} from "../errors";
import {Context} from './context';
import {Position} from "../position";
import {now, tokenTypeString, tt} from "../constants";
import { interpretArgument, runtimeArgument, uninterpretedArgument } from "./argument";
import {wrap} from './primitives/wrapStrip';
import {
    ESArray,
    ESBoolean,
    ESFunction,
    ESNamespace,
    ESNumber,
    ESObject,
    ESPrimitive,
    ESString,
    ESType,
    ESUndefined,
    Primitive,
    types
} from "./primitiveTypes";
import {dict, str} from '../util/util';

export class interpretResult {
    val: Primitive = new ESUndefined();
    error: ESError | undefined;
    funcReturn: Primitive | undefined;
    shouldBreak = false;
    shouldContinue = false;
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

        if (res.error && res.error.pos.isUnknown)
            res.error.pos = this.pos;

        if (!(res.val instanceof ESPrimitive)) {
            res.error = new TypeError(Position.unknown, 'Primitive', 'Native JS value', str(res.val));
            res.val = new ESUndefined();
        }``

        res.val.info.file ||= this.pos.file;

        Node.interprets++;
        let time = now() - start;
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

    constructor (pos: Position, left: Node, opTok: Token, right: Node) {
        super(pos);
        this.left = left;
        this.opTok = opTok;
        this.right = right;
    }

     interpret_(context: Context): ESError | Primitive {
        const left = this.left.interpret(context);
         if (left.error) return left.error;
        const right = this.right.interpret(context);
        if (right.error) return right.error;

        const l = left.val;
        const r = right.val;
        if (typeof l === 'undefined')
            return new TypeError(this.opTok.pos, '~undefined', 'undefined', l, 'N_binOp.interpret_');

        if (typeof r === 'undefined')
            return new TypeError(this.opTok.pos, '~undefined', 'undefined', r, 'N_binOp.interpret_');

        switch (this.opTok.type) {
            case tt.LTE: {
                const lt = l.__lt__({context}, r);
                const eq = l.__eq__({context}, r);
                if (lt instanceof ESError) return lt;
                if (eq instanceof ESError) return eq;
                return lt.__or__({context}, eq);

            } case tt.GTE: {
                const gt = l.__gt__({context}, r);
                const eq = l.__eq__({context}, r);
                if (gt instanceof ESError) return gt;
                if (eq instanceof ESError) return eq;
                return gt.__or__({context}, eq);

            } case tt.NOTEQUALS: {
                const res = l.__eq__({context}, r);
                if (res instanceof ESError) return res;
                return new ESBoolean(!res.bool().valueOf());

            } case tt.ADD:
                return l.__add__({context}, r);
            case tt.SUB:
                return l.__subtract__({context}, r);
            case tt.MUL:
                return l.__multiply__({context}, r);
            case tt.DIV:
                return l.__divide__({context}, r);
            case tt.POW:
                return l.__pow__({context}, r);
            case tt.EQUALS:
                return l.__eq__({context}, r);
            case tt.LT:
                return l.__lt__({context}, r);
            case tt.GT:
                return l.__gt__({context}, r);
            case tt.AND:
                return l.__and__({context}, r);
            case tt.OR:
                return l.__or__({context}, r);

            default:
                return new InvalidSyntaxError(
                    this.opTok.pos,
                    `Invalid binary operator: ${tokenTypeString[this.opTok.type]}`
                );
        }
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

    interpret_(context: Context): ESError | Primitive {
        const res = this.a.interpret(context);
        if (res.error) return res.error;

        switch (this.opTok.type) {
            case tt.SUB:
            case tt.ADD:
                if (!(res.val instanceof ESNumber))
                    return new TypeError(this.pos, 'Number', res.val?.typeName().toString() || 'undefined_', res.val?.valueOf());
                const numVal = res.val.valueOf();
                return new ESNumber(this.opTok.type === tt.SUB ? -numVal : Math.abs(numVal));
            case tt.NOT:
                return new ESBoolean(!res?.val?.bool().valueOf());
            default:
                return new InvalidSyntaxError(
                    this.opTok.pos,
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
    isLocal: boolean;
    isDeclaration: boolean;
    assignType: string;
    type: Node;

    constructor (
        pos: Position,
        varNameTok: Token, value: Node,
        assignType='=',
        isGlobal=false,
        isLocal=false,
        isConstant=false,
        isDeclaration=false,
        type: ESType | Node = types.any
    ) {
        super(pos);
        this.value = value;
        this.varNameTok = varNameTok;
        this.isGlobal = isGlobal;
        this.assignType = assignType;
        this.isConstant = isConstant;
        this.isDeclaration = isDeclaration;
        this.isLocal = isLocal;

        if (type instanceof ESType) {
            // wrap raw ESType in node
            this.type = new N_primWrapper(type);
        } else this.type = type;
    }

    interpret_(context: Context): interpretResult | ESError | Primitive {

        if (this.isDeclaration && context.hasOwn(this.varNameTok.value)) {
            return new InvalidSyntaxError(this.pos, `Symbol '${this.varNameTok.value}' already exists, and cannot be redeclared`);
        }


        const res = this.value.interpret(context);
        const typeRes = this.type.interpret(context);

        if (res.error) return res.error;
        if (typeRes.error) return typeRes.error;

        if (!typeRes.val || !(typeRes.val instanceof ESType)) {
            return new TypeError(this.varNameTok.pos, 'Type',
                typeRes.val?.typeName().valueOf() ?? 'undefined', typeRes.val?.str(), `@ !typeRes.val || !(typeRes.val instanceof ESType)`);
        }

        if (!res.val) {
            return new TypeError(this.varNameTok.pos, '~undefined', 'undefined', 'N_varAssign.interpret_');
        }

        if (!typeRes.val.includesType({context}, res.val.__type__).bool().valueOf()) {
            return new TypeError(this.varNameTok.pos,
                str(typeRes.val),
                str(res.val?.typeName()),
                str(res.val)
            );
        }


        if (this.isDeclaration) {
            if (this.assignType !== '=')
                return new InvalidSyntaxError(this.pos, `Cannot declare variable with operator '${this.assignType}'`);
            context.setOwn(this.varNameTok.value, res.val, {
                global: false,
                isConstant: this.isConstant
            });
            return res.val;
        }

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

            if (this.isDeclaration)
                return new InvalidSyntaxError(this.pos, `Cannot declare variable with operator '${this.assignType}'`);

            // assign with modifier like *= or -=
            const currentVal = context.get(this.varNameTok.value);
            if (currentVal instanceof ESError) return currentVal;

            if (currentVal == undefined)
                return new InvalidSyntaxError(this.pos, `Cannot declare variable with operator '${this.assignType}'`);

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
                isConstant: this.isConstant
            });

            if (setRes instanceof ESError) return setRes;
            res.val = newVal;
        }

        if (res.val.info.name === '(anonymous)' || !res.val.info.name)
            res.val.info.name = this.varNameTok.value;

        return res;
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

    constructor (pos: Position, comparison: Node, loop: Node) {
        super(pos);
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

    constructor (pos: Position, body: Node, array: Node, identifier: Token, isGlobalIdentifier: boolean, isConstIdentifier: boolean) {
        super(pos);
        this.body = body;
        this.array = array;
        this.identifier = identifier;
        this.isGlobalId = isGlobalIdentifier;
        this.isConstId = isConstIdentifier;
    }

    interpret_ (context: Context) {
        let newContext = new Context();
        newContext.parent = context;

        const array = this.array.interpret(context);
        if (array.error) return array;

        if (['Array', 'Number', 'Object', 'String', 'Any'].indexOf(array.val?.typeName().valueOf() || '') === -1)
            return new TypeError(
                this.identifier.pos,
                'Array | Number | Object | String',
                typeof array.val + ' | ' + array.val?.typeName()
            );

        function iteration (body: Node, id: string, element: Primitive, isGlobal: boolean, isConstant: boolean): 'break' | interpretResult | undefined {
            newContext.set(id, element, {
                global: isGlobal,
                isConstant
            });

            const res = body.interpret(newContext);
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
                this.identifier.pos,
                'Array | Number | Object | String',
                typeof array.val
            );

        return new ESUndefined();
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
            if (this.shouldClone)
                val = val.clone();
            interpreted.push(val);
        }

        result.val = new ESArray(interpreted);

        return result;
    }
}

export class N_objectLiteral extends Node {
    properties: [Node, Node][];
    constructor(pos: Position, properties: [Node, Node][]) {
        super(pos);
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
    constructor(pos: Position) {
        super(pos);
    }

    interpret_ (context: Context) {
        return new ESObject({});
    }
}

export class N_statements extends Node {
    items: Node[];
    constructor(pos: Position, items: Node[]) {
        super(pos);
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

    constructor(pos: Position, to: Node, args: Node[]) {
        super(pos);
        this.arguments = args;
        this.to = to;
    }

    interpret_ (context: Context) {
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
                // giving some extra info as well as it is the interpreted arguments so variables values not names
                line: `${val.info.name || '<AnonFunction>'}(${params.map(str).join(', ')})`
            });
        }

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
                this.returnType.pos,
                'Type',
                returnTypeRes.val?.typeName().valueOf() ?? '<Undefined>',
                returnTypeRes.val?.str().valueOf(),
                `On func '${this.name }' return type`
            );

        return new ESFunction(this.body, args, this.name, this.this_, returnTypeRes.val, context);
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

        if (val.val?.bool().valueOf())
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

    constructor(pos: Position, base: Node, index: Node) {
        super(pos);
        this.base = base;
        this.index = index;
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

            const currentVal = wrap(base.__getProperty__({context}, index));
            let newVal: Primitive | ESError;
            let assignVal = valRes.val;
            this.assignType ??= '=';

            if (!assignVal) {
                return new TypeError(this.pos, '~undefined', 'undefined', 'undefined', 'N_indexed.interpret_')
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

            if (!base.__setProperty__)
                return new TypeError(this.pos, 'mutable', 'immutable', base.valueOf());

            const res = base.__setProperty__({context}, index, newVal ?? new ESUndefined());
            if (res instanceof ESError)
                return res;
        }
        return base.__getProperty__({context}, index);
    }
}

export class N_class extends Node {

    init: N_functionDefinition | undefined;
    methods: N_functionDefinition[];
    name: string;
    extends_: Node | undefined;
    instances: ESObject[];

    constructor(pos: Position, methods: N_functionDefinition[], extends_?: Node, init?: N_functionDefinition, name = '<anon class>') {
        super(pos);
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
            if (!(res.val instanceof ESFunction))
                return new TypeError(
                    this.pos,
                    'Function',
                    res.val?.typeName().valueOf() || 'undefined',
                    'method on ' + this.name
                );
            methods.push(res.val);
        }
        let extends_;
        if (this.extends_) {
            const extendsRes = this.extends_.interpret(context);
            if (extendsRes.error)
                return extendsRes.error;
            if (!(extendsRes.val instanceof ESType))
                return new TypeError(
                    this.pos,
                    'Function',
                    extendsRes.val?.typeName().valueOf() || 'undefined',
                    'method on ' + this.name
                );
                extends_ = extendsRes.val;
        }
        let init;
        if (this.init) {
            const initRes = this.init.interpret(context);
            if (initRes.error)
                return initRes.error;
            if (!(initRes.val instanceof ESFunction))
                return new TypeError(
                    this.pos,
                    'Function',
                    initRes.val?.typeName().valueOf() || 'undefined',
                    'method on ' + this.name
                );
            init = initRes.val;
        }

        return new ESType(false, this.name, methods, extends_, init);
    }
}

export class N_namespace extends Node {
    public name: string;
    private statements: Node;
    public mutable: boolean;
    constructor(pos: Position, statements: Node, name = '(anon)', mutable=false) {
        super(pos);
        this.name = name;
        this.statements = statements;
        this.mutable = mutable;
    }

    interpret_(context: Context): Primitive | interpretResult {
        const newContext = new Context();
        newContext.parent = context;

        const res = this.statements.interpret(newContext);
        if (res.error) return res;

        return new ESNamespace(new ESString(this.name), newContext.getSymbolTableAsDict(), this.mutable);
    }
}

// --- TERMINAL NODES ---
export class N_number extends Node {
    a: Token;
    constructor(pos: Position, a: Token) {
        super(pos, true);
        this.a = a;
    }
    interpret_ (context: Context): interpretResult | ESError {
        let val = this.a.value;

        if (typeof val !== 'number') return new TypeError(
            this.pos,
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
    constructor (pos: Position, a: Token) {
        super(pos, true);
        this.a = a;
    }
    interpret_ (context: Context): interpretResult | ESError {
        let val = this.a.value;

        if (typeof val !== 'string') return new TypeError(
            this.pos,
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
        super(a.pos, true);
        this.a = a;
    }

    interpret_ (context: Context) {
        if (!context.has(this.a.value))
            return new ReferenceError(this.a.pos, this.a.value);

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

    constructor(pos = Position.unknown) {
        super(pos, true);
    }

    interpret_ (context: Context) {
        const res = new interpretResult();
        res.val = new ESUndefined();
        return res;
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
}

export class N_primWrapper extends Node {
    value: Primitive;
    constructor(val: Primitive, pos = Position.unknown) {
        super(pos, true);
        this.value = val;
    }

    public interpret_(context: Context): Primitive {
        return this.value;
    }
}