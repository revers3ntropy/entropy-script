import {CLASS_KEYWORDS, TokenType, ttToStr, tt, types, VAR_DECLARE_KEYWORDS} from '../util/constants';
import { ParseResults } from './parseResults';
import { Token } from "./tokens";
import * as n from '../runtime/nodes';
import {
    N_functionDefinition, N_indexed,
    N_namespace,
    N_primitiveWrapper, N_string,
    N_tryCatch,
    N_undefined, N_varAssign,
    N_variable,
    Node,
} from '../runtime/nodes';
import { Error, InvalidSyntaxError } from "../errors";
import Position from "../position";
import { ESType } from "../runtime/primitiveTypes";
import { IUninterpretedArgument } from "../runtime/argument";
import { Map } from "../util/util";

export class Parser {
    tokens: Token[];
    tokenIdx: number;

    constructor (tokens: Token[]) {
        this.tokens = tokens;
        this.tokenIdx = -1;
        this.advance();
    }

    public parse = (): ParseResults => {
        if (this.tokens.length === 1 && this.tokens[0].type === tt.EOF) {
            return new ParseResults();
        }

        const res = this.statements(true);

        if (!res.error && this.currentToken?.type !== TokenType.EOF && !this.currentToken) {
            return res.failure(new InvalidSyntaxError(
                'Expected EOF'), this.tokens[this.tokens.length-1]?.pos)
        }

        if (!res.error && this.currentToken?.type !== TokenType.EOF) {
            return res.failure(new InvalidSyntaxError(
                `Unexpected token of type '${ttToStr[this.currentToken?.type]}'`
            ), this.currentToken?.pos);
        }

        return res;
    }

    private advance = (res?: ParseResults): Token => {
        if (res) res.registerAdvance();

        this.tokenIdx++;
        return this.currentToken;
    }

    private get nextToken () {
        if (this.tokens.length-1 >= this.tokenIdx+1) {
            return this.tokens[this.tokenIdx+1];
        }
    }

    private get currentToken () {
        return this.tokens[this.tokenIdx] as Token<any>;
    }

    private reverse = (amount = 1): Token => {
        this.tokenIdx -= amount;
        return this.currentToken;
    }

    private consume = (res: ParseResults, type: TokenType, errorMsg?: string): void | ParseResults => {
        if (this.currentToken.type !== type)
            return res.failure(new InvalidSyntaxError(
                errorMsg ??
                `Expected '${ttToStr[type]}' but got '${ttToStr[this.currentToken.type]}'`
            ), this.currentToken.pos);

        this.advance(res);
    }

    private clearEndStatements = (res: ParseResults): void => {
        while (this.currentToken.type === tt.END_STATEMENT) {
            this.advance(res);
        }
    }

    private statements = (topLevel = false): ParseResults => {
        const res = new ParseResults();
        const pos = this.currentToken.pos;
        const statements: Node[] = [];

        this.clearEndStatements(res);

        const firstStatement = res.register(this.statement());
        if (res.error) {
            return res;
        }
        if (!firstStatement) {
            return res;
        }

        statements.push(firstStatement);

        let moreStatements = true;

        while (true) {
            let newLineCount = 0;
            // @ts-ignore
            while (this.currentToken.type === tt.END_STATEMENT) {
                this.advance(res);
                newLineCount++;
            }
            if (newLineCount === 0) {
                moreStatements = false;
            }
            if (!moreStatements) {
                break;
            }

            const statement = res.tryRegister(this.statement());
            if (res.error) return res;
            if (!statement) {
                this.reverse(res.reverseCount);
                continue;
            }
            statements.push(statement);
        }

        this.clearEndStatements(res);

         const node = new n.N_statements(pos, statements, topLevel);

        return res.success(node);
    }

    private statement = () => {
        const res = new ParseResults();
        const pos = this.currentToken.pos;

        if (this.currentToken.matches(tt.KEYWORD, 'return')) {
            return this.returnStatement(res);

        } else if (this.currentToken.matches(tt.KEYWORD, 'yield')) {
            return this.returnStatement(res, true);

        } else if (this.currentToken.matches(tt.KEYWORD, 'break')) {
            this.advance(res);
            return res.success(new n.N_break(pos));

        } else if (this.currentToken.matches(tt.KEYWORD, 'continue')) {
            this.advance(res);
            return res.success(new n.N_continue(pos));

        } else if (this.currentToken.matches(tt.KEYWORD, 'try')) {
            return this.tryCatch();

        } else if (this.currentToken.matches(TokenType.KEYWORD, 'while')) {
            return this.whileExpr();

        } else if (this.currentToken.matches(TokenType.KEYWORD, 'for')) {
            return this.forExpr();
        }

        const expr = res.register(this.expr());
        if (res.error) {
            return res;
        }

        if (this.currentToken.type !== tt.ASSIGN) {
            return res.success(expr);
        }

        const assignPos = this.currentToken.pos;
        const assignType = this.currentToken.value;

        this.advance(res);

        const value = res.register(this.expr());
        if (res.error) return res;

        if (expr instanceof N_variable) {
            return res.success(new N_varAssign(assignPos, expr.a, value, assignType));

        } else if (expr instanceof N_indexed) {
            expr.assignType = assignType;
            expr.value = value;
            return res.success(expr);

        } else {
            return res.failure(new InvalidSyntaxError('Cannot assign to this value. Expected identifier or index'), assignPos);
        }
    }

    private returnStatement = (res: ParseResults, isYield = false) => {
        const pos = this.currentToken.pos;

        this.advance(res);
        let expr: Node = new N_undefined(this.currentToken.pos);
        if (this.currentToken.type !== tt.END_STATEMENT) {
            const exprRes = res.register(this.expr());
            if (!exprRes) {
                return res.failure(new InvalidSyntaxError('Expected end of statement'), this.currentToken.pos);
            }
            expr = exprRes;
        }
        if (isYield) {
            return res.success(new n.N_yield(pos, expr));
        }
        return res.success(new n.N_return(pos, expr));
    }

    private atom = () => {
        const res = new ParseResults();
        const tok = this.currentToken;
        const pos = this.currentToken.pos;

        switch (tok.type) {
            case tt.NUMBER:
                this.advance(res);
                return res.success(new n.N_number(pos, tok));

            case tt.STRING:
                this.advance(res);
                return res.success(new n.N_string(pos, tok));

            case tt.IDENTIFIER:
                this.advance();
                return res.success(new n.N_variable(tok));

            case tt.OPAREN:
                this.advance(res);
                const expr = res.register(this.expr());
                if (res.error) return res;
                this.consume(res, tt.CPAREN);
                if (res.error) return res;
                return res.success(expr);

            case tt.OSQUARE:
                const arrayExpr = res.register(this.array());
                if (res.error) return res;
                return res.success(arrayExpr);

            case tt.OBRACES:
                const objectExpr = res.register(this.obLiteral());
                if (res.error) return res;
                return res.success(objectExpr);

            case tt.KEYWORD:
                if (tok.value === 'if') {
                    const expr = res.register(this.ifExpr());
                    if (res.error) return res;
                    return res.success(expr);
                }
                return res.failure(new InvalidSyntaxError(
                    `keyword '${tok.value}' not valid here`), this.currentToken.pos);

            default:
                return res.failure(new InvalidSyntaxError(
                    `Expected identifier, number, array, object literal, 'if', string or brackets`), this.currentToken.pos);
        }
    }

    /**
     * Gets atom, and then either '(', '[', '<|', or '.' after.
     */
    private compound = (base?: Node): ParseResults => {
        const res = new ParseResults();
        if (!base)  {
            base = res.register(this.atom());
        }
        if (res.error) return res;

        if (this.currentToken.type === tt.OGENERIC) {
            const call = res.register(this.makeGenericCall(base));
            if (res.error) return res;
            return this.compound(call);

        } else if (this.currentToken.type === tt.OPAREN) {
            const call = res.register(this.makeFunctionCall(base));
            if (res.error) return res;
            return this.compound(call);

        } else if (this.currentToken.type === tt.OSQUARE) {
            const call = res.register(this.makeIndex(base));
            if (res.error) return res;
            return this.compound(call);

        } else if (this.currentToken.type === tt.DOT) {
            this.advance(res);

            const index = this.currentToken;
            this.consume(res, tt.IDENTIFIER);

            return this.compound(new n.N_indexed(
                this.currentToken.pos,
                base,
                new N_string(this.currentToken.pos, index)
            ));

        } else {
            return res.success(base);
        }
    }

    /**
     * a (^|%|&||) b
     */
    private power = () => {
         return this.binOp(
             this.compound,
             [tt.POW, tt.MOD, tt.AMPERSAND, tt.PIPE],
             this.factor
         );
    }

    /**
     * (+|-|~|?) power
     */
    private factor = (): ParseResults => {
        const res = new ParseResults();
        const tok = this.currentToken;

        if (tok.type === tt.ADD || tok.type === tt.SUB || tok.type === tt.BITWISE_NOT || tok.type === tt.QM) {
            this.advance(res);
            const factor = res.register(this.factor());
            if (res.error) return res;
            return res.success(new n.N_unaryOp(tok.pos, factor, tok));
        }

        return this.power();
    }

    /**
     * Multiplication
     * a (*|/) b
     */
    private term = () => {
        return this.binOp(this.factor, [tt.ASTRIX, tt.DIV]);
    }

    /**
     * Addition
     * a (+|-) b
     */
    private arithmeticExpr = () => {
        return this.binOp(this.term, [tt.ADD, tt.SUB]);
    }

    /**
     * ((!|~) expr) | (a (==|!=|>|>=|<|<=) b)
     */
    private comparisonExpr = (): ParseResults => {
        const res = new ParseResults();
        if (this.currentToken.type === tt.NOT) {
            const opTok = this.currentToken;
            this.advance(res);

            const node = res.register(this.expr());
            if (res.error) return res;
            return res.success(new n.N_unaryOp(opTok.pos, node, opTok));
        }

        if (this.currentToken.type === tt.BITWISE_NOT) {
            const opTok = this.currentToken;
            this.advance(res);

            const node = res.register(this.expr());
            if (res.error) return res;
            return res.success(new n.N_unaryOp(opTok.pos, node, opTok));
        }

        const node = res.register(this.binOp(
            () => this.arithmeticExpr(),
            [tt.EQUALS, tt.NOT_EQUALS, tt.GT, tt.GTE, tt.LTE, tt.LT]
        ));

        if (res.error) return res;

        return res.success(node);
    }

    /**
     * (let|func|abstract|class|namespace) | (a ((||)|(&&)) b)
     */
    private expr = (): ParseResults => {
        const res = new ParseResults();

        this.clearEndStatements(res);

        if (this.currentToken.type === tt.KEYWORD) {
            if (VAR_DECLARE_KEYWORDS.indexOf(this.currentToken.value) !== -1) {
                return this.initiateVar(res);

            } else if (this.currentToken.value === 'func') {
                return this.funcExpr();

            } else if (CLASS_KEYWORDS.includes(this.currentToken.value)) {
                return this.classExpr();

            } else if (this.currentToken.value ==='namespace') {
                return this.namespace();
            }
        }

        const node = res.register(this.binOp(() => this.comparisonExpr(), [tt.AND, tt.OR]));

        if (res.error) return res;

        return res.success(node);
    }

    /**
     * Does a binary operation.
     * Takes a function to parse the left-hand side, which is immediately excecuted to get the left-hand side.
     * Then checks that the current token matches the possible operators, and consumes it
     * Then uses the right-hand parsing function to get the right-hand side of the expression.
     */
    private binOp = (func: () => ParseResults, ops: TokenType[] | [TokenType, string][], funcB=func): ParseResults => {
        const res = new ParseResults();
        let left = res.register(func());
        if (res.error) return res;

        while (
            ops.indexOf(this.currentToken.type as any) !== -1
            || ops.indexOf([this.currentToken.type, this.currentToken.value] as any) !== -1
        ) {
            const opTok = this.currentToken;
            this.advance(res);
            const right = res.register(funcB());
            if (res.error) return res;
            left = new n.N_binOp(left.pos, left, opTok, right);
        }

        return res.success(left);
    }

    private arguments = (res: ParseResults, allowKwargs=true) => {
        const args: Node[] = [];
        const indefiniteKwargs: Node[] = [];
        const definiteKwargs: Map<Node> = {};

        while (true) {
            // check for kwargs
            // @ts-ignore
            if (this.currentToken.type === tt.ASTRIX) {
                this.advance(res);

                if (!allowKwargs) {
                    return {
                        error: new InvalidSyntaxError('Kwargs not allowed here'),
                        args,
                        indefiniteKwargs,
                        definiteKwargs
                    };
                }

                // @ts-ignore
                if (this.currentToken.type === tt.ASTRIX) {
                    // double astrix
                    this.advance(res);
                    indefiniteKwargs.push(res.register(this.expr()));
                } else {

                    const nameTok = this.currentToken;

                    this.consume(res, tt.IDENTIFIER);
                    if (res.error) {
                        return {
                            error: res.error,
                            args,
                            indefiniteKwargs,
                            definiteKwargs
                        };
                    }

                    if (!this.currentToken.matches(tt.ASSIGN, '=')) {
                        // for '*a', which is the same as '*a=a'
                        definiteKwargs[nameTok.value] = new N_variable(nameTok);
                    } else {
                        // remove '='
                        this.advance(res);

                        definiteKwargs[nameTok.value] = res.register(this.expr());
                        if (res.error) return {
                            error: res.error,
                            args,
                            indefiniteKwargs,
                            definiteKwargs
                        };
                    }
                }
            } else {
                // normal argument
                args.push(res.register(this.expr()));
                if (res.error) {
                    return {
                        error: res.error,
                        args,
                        indefiniteKwargs,
                        definiteKwargs
                    };
                }
            }

            // @ts-ignore
            if (this.currentToken.type === tt.COMMA) {
                this.advance(res);
            } else {
                // break on no more commas
                break;
            }
        }

        return {
            args,
            indefiniteKwargs,
            definiteKwargs
        };
    }

    private makeFunctionCall = (to: Node) => {
        const res = new ParseResults();
        const pos = this.currentToken.pos;

        if (this.currentToken.type !== tt.OPAREN) {
            return res.failure(new InvalidSyntaxError(
                "Expected '('"), pos);
        }

        this.advance(res);

        // @ts-ignore
        if (this.currentToken.type === tt.CPAREN) {
            this.advance(res);
            return res.success(new n.N_functionCall(pos, to));
        }

        const {args, definiteKwargs, indefiniteKwargs, error} = this.arguments(res);
        if (error) return res.failure(error);

        // @ts-ignore
        if (this.currentToken.type !== tt.CPAREN) {
            return res.failure(new InvalidSyntaxError(
                "Expected ',' or ')'"), this.currentToken.pos);
        }

        this.advance(res);

        return res.success(new n.N_functionCall(pos, to, args, indefiniteKwargs, definiteKwargs));
    }

    private makeGenericCall = (to: Node) => {
        const res = new ParseResults();
        const pos = this.currentToken.pos;

        this.consume(res, tt.OGENERIC);
        if (res.error) return res;
        this.advance(res);
        if (res.error) return res;

        // @ts-ignore
        if (this.currentToken.type === tt.CGENERIC) {
            this.advance(res);
            const node = new n.N_functionCall(pos, to);
            node.functionType = '__generic__';
            return res.success(node);
        }

        const {args, definiteKwargs, indefiniteKwargs, error} = this.arguments(res, false);
        if (error) return res.failure(error);

        // @ts-ignore
        if (this.currentToken.type !== tt.CPAREN) {
            return res.failure(new InvalidSyntaxError(
                "Expected ',' or '|>'"), this.currentToken.pos);
        }

        this.advance(res);

        return res.success(new n.N_functionCall(pos, to, args, indefiniteKwargs, definiteKwargs, '__generic__'));
    }

    private makeIndex = (to: Node) => {
        const res = new ParseResults();
        const pos = this.currentToken.pos;

        const base = to;

        this.consume(res, tt.OSQUARE);
        if (res.error) return res;

        // @ts-ignore
        if (this.currentToken.type === tt.CSQUARE) {
            return res.failure(new InvalidSyntaxError(
                `Cannot index without expression`), pos);
        }

        const index = res.register(this.expr());
        if (res.error) return res.failure(new InvalidSyntaxError(
            "Invalid index"), this.currentToken.pos);

        // @ts-ignore
        if (this.currentToken.type !== tt.CSQUARE) {
            return res.failure(new InvalidSyntaxError(
                "Expected ']'"), this.currentToken.pos);
        }

        this.advance(res);

        return res.success(new n.N_indexed(
            pos,
            base,
            index
        ));
    }

    /**
     * Not needed atm, but might want to parse type expressions differently in the future.
     */
    private typeExpr = () => {
        return this.expr();
    }

    private destructuring = (pos: Position, isConst: boolean, isGlobal: boolean): ParseResults => {
        const res = new ParseResults();

        this.advance(res);
        if (res.error) return res;

        const identifiers: Token<string>[] = [];
        const typeNodes: Node[] = [];

        // @ts-ignore
        if (this.currentToken.type === tt.CSQUARE) {
            // empty
            this.consume(res, tt.CSQUARE);

            if (!this.currentToken.matches(tt.ASSIGN, '=')) {
                return res.failure(new InvalidSyntaxError(`Expected '='`), this.currentToken.pos)
            }

            this.consume(res, tt.ASSIGN);

            const expr = res.register(this.expr());
            if (res.error) return res;

            return res.success(new n.N_destructAssign(
                pos,
                [],
                [],
                expr,
                isGlobal,
                isConst
            ));

        }

        while (true) {
            // @ts-ignore
            if (this.currentToken.type !== tt.IDENTIFIER) {
                return res.failure(new InvalidSyntaxError(
                    `Expected identifier`), this.currentToken.pos);
            }

            identifiers.push(this.currentToken);
            this.advance(res);

            // @ts-ignore
            if (this.currentToken.type === tt.COLON) {
                this.consume(res, tt.COLON);
                const tRes = res.register(this.typeExpr());
                if (res.error) return res;
                typeNodes.push(tRes);
            } else {
                typeNodes.push(new N_primitiveWrapper(types.any));
            }

            // @ts-ignore
            if (this.currentToken.type === tt.CSQUARE) {
                this.consume(res, tt.CSQUARE);
                break;
            }
            this.consume(res, tt.COMMA);
            if (res.error) return res;
        }


        if (!this.currentToken.matches(tt.ASSIGN, '=')) {
            return res.failure(new InvalidSyntaxError(
                `Expected '='`), this.currentToken.pos)
        }

        this.consume(res, tt.ASSIGN);

        const expr = res.register(this.expr());
        if (res.error) return res;

        return res.success(new n.N_destructAssign(
            pos,
            identifiers.map(i => i.value),
            typeNodes,
            expr,
            isGlobal,
            isConst
        ));
    }

    private initiateVar = (res: ParseResults): ParseResults => {
        const pos = this.currentToken.pos;

        let isConst = true;
        let isGlobal = false;
        let isDeclaration = false;

        // (let (global)? (var)?)? identifier(: expr)? (*|/|+|-)?= expr

        if (
            this.currentToken.type === tt.KEYWORD &&
            this.currentToken.value === 'let'
        ) {
            isDeclaration = true;
            this.advance(res);
            if (res.error) return res;

            if (
                this.currentToken.type === tt.KEYWORD &&
                this.currentToken.value === 'global'
            ) {
                isDeclaration = true;
                isGlobal = true;
                this.advance(res);
                if (res.error) return res;
            }

            if (
                this.currentToken.type === tt.KEYWORD &&
                this.currentToken.value === 'var'
            ) {
                isDeclaration = true;
                isConst = false;
                this.advance(res);
                if (res.error) return res;
            }
        }

        if (this.currentToken.type === tt.KEYWORD) {
            return res.failure(new InvalidSyntaxError(
                `Expected variable declaration keyword, not ${this.currentToken.value}`), this.currentToken.pos);
        }

        if (this.currentToken.type === tt.OSQUARE) {
            return this.destructuring(pos, isConst, isGlobal);
        }

        // @ts-ignore
        if (this.currentToken.type !== TokenType.IDENTIFIER) {
            return res.failure(new InvalidSyntaxError(
                `Expected Identifier, '[' or '{'`), this.currentToken.pos);
        }

        const varName = this.currentToken;
        this.advance(res);

        let type: n.Node | ESType = types.any;

        // @ts-ignore
        if (this.currentToken.type === tt.COLON) {
            if (!isDeclaration) {
                return res.failure(new InvalidSyntaxError('Cannot type variable outside declaration'));
            }
            this.consume(res, tt.COLON);
            type = res.register(this.typeExpr());
        }

        // @ts-ignore doesn't like two different comparisons after each other with different values
        if (this.currentToken.type !== tt.ASSIGN) {
            if (isConst) {
                return res.failure(new InvalidSyntaxError(
                    'Cannot initialise constant to undefined'), pos);
            }

            return res.success(new n.N_varAssign(
                pos,
                varName,
                new n.N_undefined(this.currentToken.pos),
                '=',
                isGlobal,
                // must be false ^
                isConst,
                isDeclaration,
                type
            ));
        }

        const assignType = this.currentToken.value;

        this.advance(res);
        const expr = res.register(this.expr());
        if (res.error){
            return res;
        }

        if (expr instanceof n.N_class || expr instanceof n.N_functionDefinition) {
            expr.name = varName.value;
        }

        if (expr instanceof N_namespace) {
            expr.name = varName.value;
            expr.mutable = !isConst;
        }

        return res.success(new n.N_varAssign(
            pos,
            varName,
            expr,
            assignType,
            isGlobal,
            isConst,
            isDeclaration,
            type
        ));
    }

    private bracesExp = (): ParseResults => {
        const res = new ParseResults();

        this.consume(res, tt.OBRACES);
        if (res.error) {
            return res;
        }

        this.clearEndStatements(res);

        // @ts-ignore
        if (this.currentToken.type === tt.CBRACES) {
            this.advance(res);
            return res.success(new n.N_undefined(this.currentToken.pos));
        }
        const expr = res.register(this.statements());
        if (res.error) {
            return res;
        }

        this.consume(res, tt.CBRACES);
        if (res.error) {
            return res;
        }

        return res.success(expr);
    }

    private addEndStatement = (res: ParseResults) => {
        this.tokens.splice(this.tokenIdx, 0, new Token(
            this.currentToken.pos,
            tt.END_STATEMENT,
            undefined
        ));
        this.reverse();
        this.advance(res);
    }

    private ifExpr = (): ParseResults => {
        const res = new ParseResults();
        const pos = this.currentToken.pos;
        let ifFalse;

        if (!this.currentToken.matches(tt.KEYWORD, 'if')) {
            return res.failure(new InvalidSyntaxError("Expected 'if'"), this.currentToken.pos);
        }

        this.advance(res);

        const condition = res.register(this.expr());
        if (res.error) return res;


        const ifTrue = res.register(this.bracesExp());
        if (res.error) return res;

        this.clearEndStatements(res);

        if (this.currentToken.matches(tt.KEYWORD, 'else')) {
            this.advance(res);

            if (this.currentToken.type == tt.OBRACES) {
                ifFalse = res.register(this.bracesExp());
                if (res.error) return res;
            } else {
                ifFalse = res.register(this.statement());
                if (res.error) return res;
            }
        }

        this.addEndStatement(res);

        return res.success(new n.N_if(pos, condition, ifTrue, ifFalse));
    }

    private whileExpr = (): ParseResults => {
        const res = new ParseResults();
        const pos = this.currentToken.pos;

        if (!this.currentToken.matches(tt.KEYWORD, 'while')) {
            return res.failure(new InvalidSyntaxError(
                "Expected 'while'"), this.currentToken.pos);
        }

        this.advance(res);

        const condition = res.register(this.expr());
        if (res.error) return res;

        const loop = res.register(this.bracesExp());
        if (res.error) return res;

        this.addEndStatement(res);

        return res.success(new n.N_while(pos, condition, loop));
    }

    /**
     * Gets the __name__ and __type__ of a parameter, for example `arg1: number`
     */
    private parameter = (res: ParseResults): IUninterpretedArgument | Error => {
        let type: Node = new n.N_primitiveWrapper(types.any);
        let defaultValue: Node | undefined;
        let isKwarg = false;

        if (this.currentToken.type === tt.ASTRIX) {
            isKwarg = true;
            this.consume(res, tt.ASTRIX);
        }

        if (res.error) return res.error;

        if (this.currentToken.type !== tt.IDENTIFIER) {
            const err = new InvalidSyntaxError(
                "Expected identifier");
            err.pos = this.currentToken.pos;
            return err;
        }

        const name = this.currentToken.value;

        this.advance(res);

        // @ts-ignore
        if (this.currentToken.type === tt.COLON) {
            this.consume(res, tt.COLON);
            if (res.error) return res.error;

            type = res.register(this.typeExpr());
            if (res.error) return res.error;
        }

        if (this.currentToken.matches(tt.ASSIGN, '=')) {
            this.consume(res, tt.ASSIGN);
            if (res.error) return res.error;

            defaultValue = res.register(this.expr());
            if (res.error) return res.error;
        }

        return {
            name,
            type,
            defaultValue,
            isKwarg
        };
    }

    /**
     * (a: String, *b, *c: Number=1, *, **) {}
     */
    private funcCore = (): ParseResults => {
        const res = new ParseResults();
        const pos = this.currentToken.pos;
        let body: n.Node,
            returnType: Node = new n.N_primitiveWrapper(types.any),
            allowArgs = false,
            allowKwargs = false;

        const args: IUninterpretedArgument[] = [];

        this.consume(res, tt.OPAREN);

        // @ts-ignore
        if (this.currentToken.type === tt.CPAREN) {
            this.advance(res);

        } else {

            let usingDefault = false;
            let usingKwargs = false;

            while (true) {
                const paramStart = this.currentToken.pos;

                if (this.currentToken.type === tt.ASTRIX && this.nextToken?.type !== tt.IDENTIFIER) {
                    // must be at end, no parameters after * or ** but could have only one
                    this.advance(res);
                    if (this.currentToken.type === tt.ASTRIX) {
                        allowKwargs = true;
                        this.advance(res);
                        break;
                    } else {
                        allowArgs = true;
                    }

                    // @ts-ignore
                    if (this.currentToken.type !== tt.COMMA) {
                        break;
                    }

                    this.advance(res);
                    if (res.error) return res;

                    // look for kwargs
                    if (this.currentToken.type === tt.ASTRIX) {
                        this.advance(res);
                        if (this.currentToken.type === tt.ASTRIX) {
                            allowKwargs = true;
                            this.advance(res);
                        } else {
                            return res.failure(new InvalidSyntaxError(
                                `Cannot have ** arg followed by *, try switching them around`), this.currentToken.pos);
                        }
                        if (res.error) return res;
                        break;
                    }
                }

                const param = this.parameter(res);
                if (param instanceof Error) {
                    return res.failure(param);
                }
                if (args.filter(a => a.name === param.name).length) {
                    return res.failure(new InvalidSyntaxError(
                        `Cannot have two parameters with the same name`), paramStart);
                }
                if (usingDefault && !param.defaultValue) {
                    return res.failure(new InvalidSyntaxError(
                       'Must use default parameter here'),  this.currentToken.pos);
                }
                if (usingKwargs && !param.isKwarg) {
                    return res.failure(new InvalidSyntaxError(
                        'Must use kwarg here'), this.currentToken.pos);
                }
                if (param.defaultValue) {
                    usingDefault = true;
                }
                if (param.isKwarg) {
                    usingKwargs = true;
                }

                args.push(param);

                if (this.currentToken.type === tt.COMMA) {
                    this.advance(res);
                } else {
                    break;
                }
            }

            // @ts-ignore
            if (this.currentToken.type !== tt.CPAREN) {
                return res.failure(new InvalidSyntaxError(
                    "Expected ',' or ')'"), this.currentToken.pos);
            }
            this.advance(res);
        }

        // @ts-ignore
        if (this.currentToken.type === tt.COLON) {
            this.advance(res);

            returnType = res.register(this.typeExpr());
            if (res.error) return res;
        }

        // @ts-ignore
        if (this.currentToken.type !== tt.OBRACES) {
            body = new n.N_return(this.currentToken.pos, res.register(this.expr()));
            if (res.error) return res;
        } else {
            this.consume(res, tt.OBRACES);
            if (res.error) return res;
            if (this.currentToken.type !== tt.CBRACES)
                body = res.register(this.statements());
            else
                body = new n.N_undefined(this.currentToken.pos);
            this.consume(res, tt.CBRACES);
            if (res.error) return res;
        }

        const fn = new n.N_functionDefinition(pos, body, args, returnType);

        fn.allowKwargs = allowKwargs;
        fn.allowArgs = allowArgs;

        return res.success(fn);
    }

    private funcExpr = (): ParseResults => {
        const res = new ParseResults();
        let name: string | undefined;

        if (!this.currentToken.matches(tt.KEYWORD, 'func')) {
            return res.failure(new InvalidSyntaxError(
                "Expected 'func'"), this.currentToken.pos);
        }

        this.advance(res);
        
        if (this.currentToken.type === tt.IDENTIFIER) {
            name = this.currentToken.value;
            this.advance(res);
        }

        const func = res.register(this.funcCore());
        if (res.error) return res;
        
        if (name !== undefined) {
            if (!(func instanceof N_functionDefinition)) {
                console.error('expected function');
                throw 'expected function';
            }

            func.name = name;
            func.isDeclaration = true;
        }

        return res.success(func);
    }

    private classExpr = (name?: string): ParseResults => {
        const res = new ParseResults();
        const pos = this.currentToken.pos;
        const methods: n.N_functionDefinition[] = [];
        let init: n.N_functionDefinition | undefined;
        let extends_: n.Node = new N_primitiveWrapper(types.object);
        let identifier: string | undefined;
        let abstract = false;
        const properties: Map<Node> = {};

        if (this.currentToken.matches(tt.KEYWORD, 'abstract')) {
            this.advance(res);
            abstract = true;
        }

        if (!this.currentToken.matches(tt.KEYWORD, 'class')) {
            return res.failure(new InvalidSyntaxError(
                "Expected 'class'"), this.currentToken.pos);
        }

        this.advance(res);

        if (this.currentToken.type === tt.IDENTIFIER) {
            identifier = this.currentToken.value;
            name = identifier;
            this.advance(res);
        }

        if (this.currentToken.matches(tt.KEYWORD, 'extends')) {
            this.advance(res);

            extends_ = res.register(this.expr());
            if (res.error) return res;
        }

        this.consume(res, tt.OBRACES);
        if (res.error) return res;


        if (this.currentToken.type === tt.CBRACES) {
            this.advance(res);
            return res.success(new n.N_class(
                pos,
                [],
                {},
                extends_,
                undefined,
                name,
                identifier !== undefined,
                abstract
            ));
        }

        while (this.currentToken.type === tt.IDENTIFIER) {

            const id = this.currentToken.value;
            this.advance(res);

            // @ts-ignore
            if (this.currentToken.type === tt.OPAREN) {
                const func = res.register(this.funcCore());
                if (res.error) return res;
                if (!(func instanceof N_functionDefinition)) {
                    return res.failure(new InvalidSyntaxError(
                        `Tried to get function, but got ${func} instead`), this.currentToken.pos);
                }

                func.name = id;

                if (id === 'init') {
                    init = func;
                } else {
                    methods.push(func);
                }

                properties[id] = new N_primitiveWrapper(types.function);

                // @ts-ignore
            } else if (this.currentToken.type !== tt.COLON) {
                this.consume(res, tt.END_STATEMENT);
                if (res.error) return res;
                properties[id] = new N_primitiveWrapper(types.any);
            } else {
                this.consume(res, tt.COLON);
                properties[id] = res.register(this.typeExpr());
                if (res.error) return res;
                this.consume(res, tt.END_STATEMENT);
                if (res.error) return res;
            }
        }

        this.consume(res, tt.CBRACES);

        return res.success(new n.N_class(
            pos,
            methods,
            properties,
            extends_,
            init,
            name,
            identifier !== undefined,
            abstract
        ));
    }

    private forExpr = (): ParseResults => {
        const res = new ParseResults();
        const pos = this.currentToken.pos;
        let isConst = true;

        if (!this.currentToken.matches(tt.KEYWORD, 'for')) {
            return res.failure(new InvalidSyntaxError(
                "Expected 'for'"), this.currentToken.pos);
        }

        this.advance(res);

        if (this.currentToken.matches(tt.KEYWORD, 'var')) {
            isConst = false;
            this.advance(res);
        } else if (this.currentToken.matches(tt.KEYWORD, 'let')) {
            this.advance(res);
        }

        if (res.error) return res;

        // @ts-ignore - comparison again
        if (this.currentToken.type !== tt.IDENTIFIER) {
            return res.failure(new InvalidSyntaxError(
                "Expected identifier"), this.currentToken.pos);
        }

        const identifier = this.currentToken;

        this.advance(res);

        if (!this.currentToken.matches(tt.KEYWORD, 'in')) {
            return res.failure(new InvalidSyntaxError(
                "Expected keyword 'in'"), this.currentToken.pos);
        }

        this.advance(res);

        const array = res.register(this.expr());
        if (res.error) return res;

        const body = res.register(this.bracesExp());
        if (res.error) return res;

        this.addEndStatement(res);
        if (res.error) return res;

        return res.success(new n.N_for(
            pos, body, array, identifier, false, isConst
        ));
    }

    private array = () => {
        const res = new ParseResults();
        const elements: Node[] = [];
        const pos = this.currentToken.pos;

        if (this.currentToken.type !== tt.OSQUARE) {
            return res.failure(new InvalidSyntaxError(
                "Expected '["), pos);
        }

        this.advance(res);

        // @ts-ignore
        if (this.currentToken.type === tt.CSQUARE) {
            this.advance(res);

            return res.success(new n.N_array(pos, []));
        }

        elements.push(res.register(this.expr()));

        if (res.error) {
            return res.failure(new InvalidSyntaxError(
                "Unexpected token"), this.currentToken.pos);
        }

        // @ts-ignore
        while (this.currentToken.type === tt.COMMA) {
            this.advance(res);

            elements.push(res.register(this.expr()));
            if (res.error) return res;
        }

        // @ts-ignore
        if (this.currentToken.type !== tt.CSQUARE) {
            return res.failure(new InvalidSyntaxError(
                "Expected ',' or ']'"), this.currentToken.pos);
        }

        this.advance(res);

        return res.success(new n.N_array(pos, elements));
    }

    private obLiteral = () => {
        const res = new ParseResults();
        const properties: [Node, Node][] = [];
        const pos = this.currentToken.pos;

        if (this.currentToken.type !== tt.OBRACES) {
            return res.failure(new InvalidSyntaxError(
                "Expected '{"), pos);
        }

        this.advance(res);

        // @ts-ignore
        if (this.currentToken.type === tt.CBRACES) {
            this.advance(res);
            return res.success(new n.N_objectLiteral(pos, []));
        }
        // @ts-ignore
        while (true) {

            let keyType: string,
                key: Node,
                value: Node;

            // @ts-ignore
            if (this.currentToken.type === tt.IDENTIFIER) {
                keyType = 'id';
                key = new n.N_string(
                    this.currentToken.pos,
                    this.currentToken
                );
                this.advance(res);

            // @ts-ignore
            } else if (this.currentToken.type === tt.STRING) {
                keyType = 'string';
                key = new n.N_string(
                    this.currentToken.pos,
                    this.currentToken
                );
                this.advance(res);

            // @ts-ignore
            } else if (this.currentToken.type === tt.OSQUARE) {
                keyType = 'value';
                this.advance(res);
                key = res.register(this.expr());
                if (res.error) return res;
                if (this.currentToken.type !== tt.CSQUARE) {
                    return res.failure(new InvalidSyntaxError(
                        `Expected ']', got '${ttToStr[this.currentToken.type]}'`), this.currentToken.pos);
                }
                this.advance(res);
            } else {
                break;
            }

            if (this.currentToken.type === tt.COLON) {
                this.advance(res);
                value = res.register(this.expr());
                if (res.error) return res;

                if (this.currentToken.type !== tt.COMMA && this.currentToken.type !== tt.CBRACES) {
                    return res.failure(new InvalidSyntaxError(
                        `Expected ',' or '}', got '${ttToStr[this.currentToken.type]}'`
                    ), this.currentToken.pos);
                }

                if (this.currentToken.type === tt.COMMA) {
                    this.advance(res);
                }

            } else {
                if (this.currentToken.type !== tt.COMMA && this.currentToken.type !== tt.CBRACES) {
                    return res.failure(new InvalidSyntaxError(
                        `Expected ',' or '}', got '${ttToStr[this.currentToken.type]}'`), this.currentToken.pos);
                }

                if (keyType !== 'id') {
                    return res.failure(new InvalidSyntaxError(
                        `You must specify a value when initialising an object literal with a key that is not an identifier.
                        Try using \`key: value\` syntax.`
                    ), this.currentToken.pos);
                }

                // reverse back to the identifier
                this.reverse();

                value = new n.N_variable(this.currentToken);
                this.advance(res);
                if (this.currentToken.type === tt.COMMA) {
                    this.advance(res);
                }
            }

            properties.push([key, value]);
            if (res.error) return res;
        }

        // @ts-ignore
        if (this.currentToken.type !== tt.CBRACES) {
            return res.failure(new InvalidSyntaxError(
                "Expected identifier, ',' or '}'"), this.currentToken.pos);
        }

        this.advance(res);

        return res.success(new n.N_objectLiteral(pos, properties));
    }

    private namespace = () => {
        const res = new ParseResults();
        const pos = this.currentToken.pos;

        let name: string | undefined;

        this.consume(res, tt.KEYWORD);
        if (res.error) return res;

        if (this.currentToken.type === tt.IDENTIFIER) {
            name = this.currentToken.value;
            this.advance(res);
        }

        this.consume(res, tt.OBRACES);
        if (res.error) return res;

        if (this.currentToken.type === tt.CBRACES) {
            this.advance(res);
            return res.success(new n.N_namespace(pos, new n.N_undefined()));
        }

        const statements = res.register(this.statements());
        if (res.error) return res;

        this.consume(res, tt.CBRACES);
        if (res.error) return res;

        return res.success(new n.N_namespace(pos, statements, name, false));
    }

    private tryCatch = (): ParseResults => {
        const res = new ParseResults();

        this.consume(res, tt.KEYWORD);
        if (res.error) return res;
        this.consume(res, tt.OBRACES);
        if (res.error) return res;

        if (this.currentToken.type === tt.CBRACES) {
            return res.failure(new InvalidSyntaxError(
                'No empty try block'), this.currentToken.pos);
        }

        const body = res.register(this.statements());
        if (res.error) return res;

        this.consume(res, tt.CBRACES);
        if (res.error) return res;

        if (this.currentToken.value !== 'catch') {
            return res.failure(new InvalidSyntaxError(
                'try block requires catch'), this.currentToken.pos);
        }

        this.consume(res, tt.KEYWORD);
        if (res.error) return res;

        this.consume(res, tt.OBRACES);
        if (res.error) return res;

        // @ts-ignore
        if (this.currentToken.type === tt.CBRACES) {
            return res.success(new N_tryCatch(this.currentToken.pos, body, new N_undefined()));
        }

        const catchBlock = res.register(this.statements());
        if (res.error) return res;

        this.consume(res, tt.CBRACES);
        if (res.error) return res;

        this.addEndStatement(res);
        if (res.error) return res;

        return res.success(new N_tryCatch(this.currentToken.pos, body, catchBlock));
    }
}
