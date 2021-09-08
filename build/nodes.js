import { tokenTypeString, tt } from "./tokens.js";
import { ESError, InvalidSyntaxError, ReferenceError, TypeError } from "./errors.js";
import { Context } from "./context.js";
import { Position } from "./position.js";
import { deepClone, str } from "./util.js";
import { None, now, Undefined } from "./constants.js";
export class interpretResult {
    constructor() {
        this.shouldBreak = false;
        this.shouldContinue = false;
    }
}
export class Node {
    constructor(startPos, endPos, isTerminal = false) {
        this.endPos = endPos;
        this.startPos = startPos;
        this.isTerminal = isTerminal;
    }
    interpret(context) {
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
        }
        else
            res.val = val;
        let time = now() - start;
        Node.interprets++;
        Node.totalTime += time;
        if (time > Node.maxTime)
            Node.maxTime = time;
        return res;
    }
}
Node.interprets = 0;
Node.totalTime = 0;
Node.maxTime = 0;
// --- NON-TERMINAL NODES ---
export class N_binOp extends Node {
    constructor(startPos, endPos, left, opTok, right) {
        super(startPos, endPos);
        this.left = left;
        this.opTok = opTok;
        this.right = right;
    }
    interpret_(context) {
        const left = this.left.interpret(context);
        const right = this.right.interpret(context);
        if (left.error)
            return left;
        if (right.error)
            return right;
        const l = left.val;
        const r = right.val;
        switch (this.opTok.type) {
            case tt.ADD:
                return l + r;
            case tt.DIV:
                return l / r;
            case tt.MUL:
                return l * r;
            case tt.SUB:
                return l - r;
            case tt.POW:
                return Math.pow(l, r);
            case tt.LTE:
                return l <= r;
            case tt.GTE:
                return l >= r;
            case tt.GT:
                return l > r;
            case tt.LT:
                return l < r;
            case tt.EQUALS:
                return l === r;
            case tt.NOTEQUALS:
                return l !== r;
            case tt.AND:
                return l && r;
            case tt.OR:
                return l || r;
            default:
                return 0;
        }
    }
}
export class N_unaryOp extends Node {
    constructor(startPos, endPos, a, opTok) {
        super(startPos, endPos);
        this.a = a;
        this.opTok = opTok;
    }
    interpret_(context) {
        const res = this.a.interpret(context);
        if (res.error)
            return res;
        switch (this.opTok.type) {
            case tt.SUB:
                return -res.val;
            case tt.ADD:
                return res.val;
            case tt.NOT:
                if (res.val instanceof Undefined)
                    return true;
                return !res.val;
            default:
                return new InvalidSyntaxError(this.opTok.startPos, this.opTok.endPos, `Invalid unary operator: ${tokenTypeString[this.opTok.type]}`);
        }
    }
}
export class N_varAssign extends Node {
    constructor(startPos, endPos, varNameTok, value, assignType = '=', isGlobal = false, isConstant = false) {
        super(startPos, endPos);
        this.value = value;
        this.varNameTok = varNameTok;
        this.isGlobal = isGlobal;
        this.assignType = assignType;
        this.isConstant = isConstant;
    }
    interpret_(context) {
        const res = this.value.interpret(context);
        if (res.error)
            return res;
        if (this.assignType === '=') {
            const setRes = context.set(this.varNameTok.value, res.val, {
                global: this.isGlobal,
                isConstant: this.isConstant
            });
            if (setRes instanceof ESError)
                return setRes;
        }
        else {
            const currentVal = context.get(this.varNameTok.value);
            if (currentVal instanceof ESError)
                return currentVal;
            let newVal;
            let assignVal = res.val;
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
                    return new ESError(this.startPos, this.endPos, 'AssignError', `Cannot find assignType of ${this.assignType[0]}`);
            }
            let setRes = context.set(this.varNameTok.value, newVal, {
                global: this.isGlobal,
                isConstant: this.isConstant
            });
            if (setRes instanceof ESError)
                return setRes;
            res.val = newVal;
        }
        return res;
    }
}
export class N_if extends Node {
    constructor(startPos, endPos, comparison, ifTrue, ifFalse) {
        super(startPos, endPos);
        this.comparison = comparison;
        this.ifFalse = ifFalse;
        this.ifTrue = ifTrue;
    }
    interpret_(context) {
        let newContext = new Context();
        newContext.parent = context;
        let res = None;
        let compRes = this.comparison.interpret(context);
        if (compRes.error)
            return compRes;
        if (compRes.val) {
            res = this.ifTrue.interpret(newContext);
            // so that if statements always return a value of None
            res.val = None;
            if (res.error)
                return res;
        }
        else if (this.ifFalse) {
            res = this.ifFalse.interpret(newContext);
            // so that if statements always return a value of None
            res.val = None;
            if (res.error)
                return res;
        }
        return res;
    }
}
export class N_while extends Node {
    constructor(startPos, endPos, comparison, loop) {
        super(startPos, endPos);
        this.comparison = comparison;
        this.loop = loop;
    }
    interpret_(context) {
        let newContext = new Context();
        newContext.parent = context;
        while (true) {
            let shouldLoop = this.comparison.interpret(context);
            if (shouldLoop.error)
                return shouldLoop;
            if (!shouldLoop.val)
                break;
            let potentialError = this.loop.interpret(newContext);
            if (potentialError.error)
                return potentialError;
            if (potentialError.shouldBreak)
                break;
        }
        return None;
    }
}
export class N_for extends Node {
    constructor(startPos, endPos, body, array, identifier, isGlobalIdentifier, isConstIdentifier) {
        super(startPos, endPos);
        this.body = body;
        this.array = array;
        this.identifier = identifier;
        this.isGlobalId = isGlobalIdentifier;
        this.isConstId = isConstIdentifier;
    }
    interpret_(context) {
        let newContext = new Context();
        newContext.parent = context;
        let res = None;
        const array = this.array.interpret(context);
        if (array.error)
            return array;
        if (!Array.isArray(array.val) && !['string', 'number', 'object'].includes(typeof array.val))
            return new TypeError(this.identifier.startPos, this.identifier.endPos, 'array | string', typeof array.val);
        function iteration(body, id, element, isGlobal, isConstant) {
            newContext.set(id, element, {
                global: isGlobal,
                isConstant
            });
            res = body.interpret(newContext);
            if (res.error || (res.funcReturn !== undefined))
                return res;
            if (res.shouldBreak) {
                res.shouldBreak = false;
                return 'break';
            }
            if (res.shouldContinue)
                res.shouldContinue = false;
        }
        if (typeof array.val === 'number') {
            for (let i = 0; i < array.val; i++) {
                const res = iteration(this.body, this.identifier.value, i, this.isGlobalId, this.isConstId);
                if (res === 'break')
                    break;
                if (res && (res.error || (res.funcReturn !== undefined)))
                    return res;
            }
        }
        else if (typeof array.val === 'object' && !Array.isArray(array.val)) {
            for (let element in array.val) {
                const res = iteration(this.body, this.identifier.value, element, this.isGlobalId, this.isConstId);
                if (res === 'break')
                    break;
                if (res && (res.error || (res.funcReturn !== undefined)))
                    return res;
            }
        }
        else {
            for (let element of array.val) {
                const res = iteration(this.body, this.identifier.value, element, this.isGlobalId, this.isConstId);
                if (res === 'break')
                    break;
                if (res && (res.error || (res.funcReturn !== undefined)))
                    return res;
            }
        }
        return res;
    }
}
export class N_array extends Node {
    constructor(startPos, endPos, items) {
        super(startPos, endPos);
        this.items = items;
    }
    interpret_(context) {
        let interpreted = [];
        for (let item of this.items) {
            const res = item.interpret(context);
            if (res.error || (res.funcReturn !== undefined))
                return res;
            interpreted.push(deepClone(res.val));
        }
        return interpreted;
    }
}
export class N_objectLiteral extends Node {
    constructor(startPos, endPos, properties) {
        super(startPos, endPos);
        this.properties = properties;
    }
    interpret_(context) {
        let interpreted = {};
        for (const [keyNode, valueNode] of this.properties) {
            const value = valueNode.interpret(context);
            if (value.error)
                return value;
            const key = keyNode.interpret(context);
            if (key.error)
                return key;
            interpreted[key.val] = deepClone(value.val);
        }
        return interpreted;
    }
}
export class N_emptyObject extends Node {
    constructor(startPos, endPos) {
        super(startPos, endPos);
    }
    interpret_(context) {
        return {};
    }
}
export class N_statements extends Node {
    constructor(startPos, endPos, items) {
        super(startPos, endPos);
        this.items = items;
    }
    interpret_(context) {
        for (let item of this.items) {
            const res = item.interpret(context);
            if (res.error || (res.funcReturn !== undefined) || res.shouldBreak || res.shouldContinue)
                return res;
        }
        return None;
    }
}
export class N_functionCall extends Node {
    constructor(startPos, endPos, to, args) {
        super(startPos, endPos);
        this.arguments = args;
        this.to = to;
    }
    interpret_(context) {
        let func = this.to.interpret(context);
        if (func.error)
            return func;
        if (func.val instanceof N_function)
            return this.runFunc(func.val, context);
        else if (func.val instanceof N_builtInFunction)
            return this.runBuiltInFunction(func.val, context);
        else if (func.val instanceof N_class)
            return this.runConstructor(func.val, context);
        else if (typeof func.val === 'function') {
            let args = [];
            for (let arg of this.arguments) {
                let value = arg.interpret(context);
                if (value.error)
                    return value.error;
                args.push(value.val);
            }
            return func.val(...args);
        }
        else
            return new TypeError(this.startPos, this.endPos, 'function', typeof func.val);
    }
    genContext(context, paramNames) {
        var _b;
        const newContext = new Context();
        newContext.parent = context;
        let args = [];
        let max = Math.max(paramNames.length, this.arguments.length);
        for (let i = 0; i < max; i++) {
            let value = None;
            if (this.arguments[i] !== undefined) {
                let res = this.arguments[i].interpret(context);
                if (res.error)
                    return res.error;
                value = (_b = res.val) !== null && _b !== void 0 ? _b : None;
            }
            args.push(value);
            if (paramNames[i] !== undefined)
                newContext.setOwn(value, paramNames[i]);
        }
        let setRes = newContext.setOwn(args, 'args');
        if (setRes instanceof ESError)
            return setRes;
        return newContext;
    }
    runFunc(func, context) {
        var _b;
        const newContext = this.genContext(context, func.arguments);
        if (newContext instanceof ESError)
            return newContext;
        let this_ = (_b = func.this_) !== null && _b !== void 0 ? _b : None;
        if (typeof this_ !== 'object')
            return new TypeError(this.startPos, this.endPos, 'object', typeof this_, this_, '\'this\' must be an object');
        let setRes = newContext.set('this', this_);
        if (setRes instanceof ESError)
            return setRes;
        const res = func.body.interpret(newContext);
        if (res.funcReturn !== undefined) {
            res.val = res.funcReturn;
            res.funcReturn = undefined;
        }
        return res;
    }
    runBuiltInFunction(func, context) {
        const newContext = this.genContext(context, func.argNames);
        if (newContext instanceof ESError)
            return newContext;
        return func.interpret(newContext);
    }
    runConstructor(constructor, context) {
        var _b, _c;
        const newContext = this.genContext(context, (_c = (_b = constructor === null || constructor === void 0 ? void 0 : constructor.init) === null || _b === void 0 ? void 0 : _b.arguments) !== null && _c !== void 0 ? _c : []);
        if (newContext instanceof ESError)
            return newContext;
        return constructor.genInstance(newContext);
    }
}
export class N_function extends Node {
    constructor(startPos, endPos, body, argNames, name = '<anon func>', this_ = {}) {
        super(startPos, endPos);
        this.arguments = argNames;
        this.body = body;
        this.name = name;
        this.this_ = this_;
    }
    interpret_(context) {
        return this;
    }
}
export class N_builtInFunction extends Node {
    constructor(func, argNames) {
        super(Position.unknown, Position.unknown);
        this.func = func;
        this.argNames = argNames;
    }
    interpret_(context) {
        // never called except to execute, so can use this function
        return this.func(context);
    }
}
export class N_return extends Node {
    constructor(startPos, endPos, value) {
        super(startPos, endPos);
        this.value = value;
    }
    interpret_(context) {
        const res = new interpretResult();
        if (this.value === undefined) {
            res.funcReturn = None;
            return res;
        }
        let val = this.value.interpret(context);
        if (val.error)
            return val.error;
        res.funcReturn = val.val;
        return res;
    }
}
export class N_yield extends Node {
    constructor(startPos, endPos, value) {
        super(startPos, endPos);
        this.value = value;
    }
    interpret_(context) {
        const res = new interpretResult();
        if (this.value === undefined) {
            res.funcReturn = None;
            return res;
        }
        let val = this.value.interpret(context);
        if (val.error)
            return val.error;
        if (val.val)
            res.funcReturn = val.val;
        return res;
    }
}
export class N_indexed extends Node {
    constructor(startPos, endPos, base, index) {
        super(startPos, endPos);
        this.base = base;
        this.index = index;
    }
    interpret_(context) {
        var _b;
        let baseRes = this.base.interpret(context);
        if (baseRes.error)
            return baseRes;
        let indexRes = this.index.interpret(context);
        if (indexRes.error)
            return indexRes;
        const index = indexRes.val;
        const base = baseRes.val;
        if (!['string', 'number'].includes(typeof index))
            return new TypeError(this.startPos, this.endPos, 'string | number', typeof index, index, `With base ${base} and index ${index}`);
        if (!['object', 'function', 'string'].includes(typeof base))
            return new TypeError(this.startPos, this.endPos, 'object | array | string | function', typeof base);
        if (this.value !== undefined) {
            let valRes = this.value.interpret(context);
            if (valRes.error)
                return valRes;
            const currentVal = base[index];
            let newVal;
            let assignVal = valRes.val;
            (_b = this.assignType) !== null && _b !== void 0 ? _b : (this.assignType = '=');
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
                case '=':
                    newVal = assignVal;
                    break;
                default:
                    return new ESError(this.startPos, this.endPos, 'AssignError', `Cannot find assignType of ${this.assignType[0]}`);
            }
            base[index] = newVal !== null && newVal !== void 0 ? newVal : None;
        }
        return base[index];
    }
}
export class N_class extends Node {
    constructor(startPos, endPos, methods, extends_, init, name = '<anon class>') {
        super(startPos, endPos);
        this.init = init;
        this.methods = methods;
        this.name = name;
        this.extends_ = extends_;
        this.instances = [];
    }
    interpret_(context) {
        return this;
    }
    genInstance(context, runInit = true, on = { constructor: this }) {
        function dealWithExtends(context_, classNode, instance) {
            const constructor = instance.constructor;
            const classNodeRes = classNode.interpret(context);
            if (classNodeRes.error)
                return classNodeRes.error;
            if (!(classNodeRes.val instanceof N_class))
                return new TypeError(classNode.startPos, classNode.endPos, 'N_class', typeof classNodeRes.val, classNodeRes.val);
            const extendsClass = classNodeRes.val;
            let setRes = context_.setOwn(() => {
                var _b, _c;
                const newContext = new Context();
                newContext.parent = context;
                let setRes = newContext.setOwn(instance, 'this');
                if (setRes instanceof ESError)
                    return setRes;
                if (extendsClass.extends_ !== undefined) {
                    let _a = dealWithExtends(newContext, extendsClass.extends_, instance);
                    if (_a instanceof ESError)
                        return _a;
                }
                const res_ = (_c = (_b = extendsClass === null || extendsClass === void 0 ? void 0 : extendsClass.init) === null || _b === void 0 ? void 0 : _b.body) === null || _c === void 0 ? void 0 : _c.interpret(newContext);
                if (res_ && res_.error)
                    return res_;
            }, 'super');
            if (setRes instanceof ESError)
                return setRes;
            instance = extendsClass.genInstance(context, false, instance);
            if (instance instanceof ESError)
                return instance;
            // index access to prevent annoying wiggly red line
            instance.constructor = constructor;
            return instance;
        }
        let instance = on;
        const newContext = new Context();
        newContext.parent = context;
        if (this.extends_ !== undefined) {
            let _a = dealWithExtends(newContext, this.extends_, instance);
            if (_a instanceof ESError)
                return _a;
        }
        for (let method of this.methods) {
            // shallow clone of method with instance as this_
            instance[method.name] = new N_function(method.startPos, method.endPos, method.body, method.arguments, method.name, instance);
        }
        if (runInit) {
            newContext.setOwn(instance, 'this');
            if (this.init) {
                const res = this.init.body.interpret(newContext);
                // return value of init is ignored
                if (res.error)
                    return res.error;
            }
        }
        this.instances.push(instance);
        return instance;
    }
}
export class N_fString extends Node {
    constructor(startPos, endPos, parts) {
        super(startPos, endPos);
        this.parts = parts;
    }
    interpret_(context) {
        let out = '';
        for (let part of this.parts) {
            let res = part.interpret(context);
            if (res.error)
                return res;
            // 1 to prevent '' around string
            out += str(res.val, 1);
        }
        return out;
    }
}
// --- TERMINAL NODES ---
export class N_number extends Node {
    constructor(startPos, endPos, a) {
        super(startPos, endPos, true);
        this.a = a;
    }
    interpret_(context) {
        if (typeof this.a.value !== 'number')
            return new TypeError(this.startPos, this.endPos, 'number', typeof this.a.value);
        return this.a.value;
    }
}
export class N_string extends Node {
    constructor(startPos, endPos, a) {
        super(startPos, endPos, true);
        this.a = a;
    }
    interpret_(context) {
        if (typeof this.a.value !== 'string')
            return new TypeError(this.startPos, this.endPos, 'string', typeof this.a.value);
        return this.a.value;
    }
}
export class N_variable extends Node {
    constructor(startPos, endPos, a) {
        super(startPos, endPos, true);
        this.a = a;
    }
    interpret_(context) {
        let val = context.get(this.a.value);
        if (val === undefined)
            return new ReferenceError(this.a.startPos, this.a.endPos, this.a.value);
        return val;
    }
}
export class N_undefined extends Node {
    constructor(startPos = Position.unknown, endPos = Position.unknown) {
        super(startPos, endPos, true);
    }
    interpret_(context) {
        return None;
    }
}
export class N_break extends Node {
    constructor(startPos, endPos) {
        super(startPos, endPos, true);
    }
    interpret_(context) {
        const res = new interpretResult();
        res.shouldBreak = true;
        return res;
    }
}
export class N_continue extends Node {
    constructor(startPos, endPos) {
        super(startPos, endPos, true);
    }
    interpret_(context) {
        const res = new interpretResult();
        res.shouldContinue = true;
        return res;
    }
}
