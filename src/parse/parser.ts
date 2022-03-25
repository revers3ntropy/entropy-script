import { tokenType, tokenTypeString, tt, types, VAR_DECLARE_KEYWORDS } from '../constants';
import {ParseResults} from './parseResults';
import {Token} from "./tokens";
import * as n from '../runtime/nodes';
import {
    N_functionDefinition,
    N_namespace,
    N_primitiveWrapper,
    N_tryCatch,
    N_undefined,
    N_variable,
    Node,
} from '../runtime/nodes';
import { ESError, InvalidSyntaxError } from "../errors";
import Position from "../position";
import { ESType } from "../runtime/primitiveTypes";
import { uninterpretedArgument } from "../runtime/argument";

export class Parser {
    tokens: Token[];
    currentToken: Token<any>;
    tokenIdx: number;

    constructor (tokens: Token[]) {
        this.tokens = tokens;
        this.tokenIdx = -1;
        this.currentToken = tokens[0];
        this.advance();
    }

    public parse (): ParseResults {
        if (!this.currentToken || !this.tokens || (this.tokens.length === 1 && this.tokens[0].type === tt.EOF)) {
            return new ParseResults();
        }

        const res = this.statements(true);

        if (!res.error && this.currentToken.type !== tokenType.EOF) {
            return res.failure(new InvalidSyntaxError(
                this.currentToken?.pos,
                `Expected 'End of File', got token of type '${tokenTypeString[this.currentToken.type]}'`
            ));
        }

        return res;
    }

    private advance (res?: ParseResults): Token {
        if (res) res.registerAdvance();

        this.tokenIdx++;
        this.currentToken = this.tokens[this.tokenIdx];
        return this.currentToken;
    }

    private reverse (amount = 1): Token {
        this.tokenIdx -= amount;
        this.currentToken = this.tokens[this.tokenIdx];
        return this.currentToken;
    }

    private consume (res: ParseResults, type: tokenType, errorMsg?: string): void | ParseResults {
        if (this.currentToken.type !== type)
            return res.failure(new InvalidSyntaxError(
                this.currentToken.pos,
                errorMsg ?? `Expected '${tokenTypeString[type]}' but got '${tokenTypeString[this.currentToken.type]}'`
            ));

        this.advance(res);
    }

    private clearEndStatements (res: ParseResults): void {
        while (this.currentToken.type === tt.ENDSTATEMENT) {
            this.advance(res);
        }
    }

    private statements (topLevel = false): ParseResults {
        const res = new ParseResults();
        const pos = this.currentToken.pos;
        let statements: Node[] = [];

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
            while (this.currentToken.type === tt.ENDSTATEMENT) {
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

        let node = new n.N_statements(pos, statements, topLevel);

        return res.success(node);
    }

    private statement () {
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

        } else if (this.currentToken.matches(tokenType.KEYWORD, 'while')) {
            return this.whileExpr();

        } else if (this.currentToken.matches(tokenType.KEYWORD, 'for')) {
            return this.forExpr();
        }

        const expr = res.register(this.expr());
        if (res.error) {
            return res;
        }

        return res.success(expr);
    }

    private returnStatement (res: ParseResults, isYield = false) {
        const pos = this.currentToken.pos;

        this.advance(res);
        let expr: Node = new N_undefined(this.currentToken.pos);
        if (this.currentToken.type !== tt.ENDSTATEMENT) {
            let exprRes = res.register(this.expr());
            if (!exprRes) {
                return res.failure(new InvalidSyntaxError(this.currentToken.pos, 'Expected end of statement'));
            }
            expr = exprRes;
        }
        if (isYield) {
            return res.success(new n.N_yield(pos, expr));
        }
        return res.success(new n.N_return(pos, expr));
    }

    private atom () {
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
                return this.atomIdentifier(res, pos, tok);

            case tt.OPAREN:
                this.advance(res);
                const expr = res.register(this.expr());
                if (res.error) return res;
                if (this.currentToken.type === tt.CPAREN) {
                    this.advance(res);
                    return res.success(expr);
                }
                return res.failure(new InvalidSyntaxError(
                    this.currentToken.pos,
                    "Expected ')'"
                ));

            case tt.OSQUARE:
                let arrayExpr = res.register(this.array());
                if (res.error) return res;
                return res.success(arrayExpr);

            case tt.OBRACES:
                let objectExpr = res.register(this.object());
                if (res.error) return res;
                return res.success(objectExpr);

            case tt.KEYWORD:
                if (tok.value === 'if') {
                    const expr = res.register(this.ifExpr());
                    if (res.error) return res;
                    return res.success(expr);
                }
                return res.failure(new InvalidSyntaxError(
                    this.currentToken.pos,
                    `Invalid Identifier ${tok.value}`
                ));

            default:
                return res.failure(new InvalidSyntaxError(
                    this.currentToken.pos,
                    `Expected number, identifier, '(', '+' or '-'`
                ));
        }
    }

    private atomIdentifier (res: ParseResults, pos: Position, tok: Token<string>) {
        this.advance(res);

        let node: Node = new n.N_variable(tok);

        let prevNode: Node = new n.N_undefined(pos);

        let functionCall = false;

        while ([tt.OPAREN, tt.OSQUARE, tt.DOT].indexOf(this.currentToken.type) !== -1) {
            switch (this.currentToken.type) {
                case tt.OPAREN:
                    functionCall = true;
                    const tempNode = node;
                    node = res.register(this.makeFunctionCall(node));
                    prevNode = tempNode;
                    if (res.error) return res;
                    break;

                case tt.OSQUARE:
                    prevNode = node;
                    node = res.register(this.makeIndex(node));
                    if (res.error) return res;
                    break;

                case tt.DOT:
                    this.advance(res);
                    // @ts-ignore
                    if (this.currentToken.type !== tt.IDENTIFIER) {
                        return res.failure(new InvalidSyntaxError(
                            this.currentToken.pos,
                            `Expected identifier after '.'`
                        ));
                    }

                    prevNode = node;
                    node = new n.N_indexed(
                        this.currentToken.pos,
                        node,
                        new n.N_string(
                            this.currentToken.pos,
                            this.currentToken
                        )
                    );
                    this.advance(res);
            }
        }

        if (this.currentToken.type === tt.ASSIGN) {
            let assignType = this.currentToken.value;
            if (functionCall) {
                return res.failure(new InvalidSyntaxError(
                    pos,
                    `Cannot assign to return value of function`
                ));
            }
            this.advance(res);
            const value = res.register(this.expr());

            if (node instanceof n.N_variable) {
                node = new n.N_varAssign(
                    pos,
                    node.a,
                    value,
                    assignType,
                    false
                );

            } else if (node instanceof n.N_indexed) {
                node.value = value;
                node.assignType = assignType;
            } else {
                return res.failure(new InvalidSyntaxError(
                    pos,
                    `Cannot have node of type ${this.currentToken.constructor.name}.
                            Expected either index or variable node.`
                ))
            }

            if (res.error) return res;
        }

        return res.success(node);
    }

    private power () {
         return this.binOp(
             () => this.atom(),
             [tt.POW, tt.MOD, tt.APMERSAND, tt.PIPE],
             () => this.factor()
         );
    }

    private factor (): ParseResults {
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

    private term () {
        return this.binOp(() => this.factor(), [tt.MUL, tt.DIV]);
    }

    private arithmeticExpr () {
        return this.binOp(() => this.term(), [tt.ADD, tt.SUB]);
    }

    private comparisonExpr (): ParseResults {
        const res = new ParseResults();
        if (this.currentToken.type === tt.NOT) {
            const opTok = this.currentToken;
            this.advance(res);

            let node = res.register(this.expr());
            if (res.error) return res;
            return res.success(new n.N_unaryOp(opTok.pos, node, opTok));
        }

        if (this.currentToken.type === tt.BITWISE_NOT) {
            const opTok = this.currentToken;
            this.advance(res);

            let node = res.register(this.expr());
            if (res.error) return res;
            return res.success(new n.N_unaryOp(opTok.pos, node, opTok));
        }

        let node = res.register(this.binOp(
            () => this.arithmeticExpr(),
            [tt.EQUALS, tt.NOTEQUALS, tt.GT, tt.GTE, tt.LTE, tt.LT]
        ));

        if (res.error) return res;

        return res.success(node);
    }

    private expr (): ParseResults {
        const res = new ParseResults();

        this.clearEndStatements(res);

        if (this.currentToken.type === tt.KEYWORD && VAR_DECLARE_KEYWORDS.indexOf(this.currentToken.value) !== -1) {
            return this.initiateVar(res);

        } else if (this.currentToken.matches(tokenType.KEYWORD, 'func')) {
            return this.funcExpr();

        } else if (this.currentToken.matches(tokenType.KEYWORD, 'class')) {
            return this.classExpr();

        } else if (this.currentToken.matches(tokenType.KEYWORD, 'namespace')) {
            return this.namespace();
        }

        let node = res.register(this.binOp(() => this.comparisonExpr(), [tt.AND, tt.OR]));

        if (res.error) return res;

        return res.success(node);
    }

    private binOp (func: () => ParseResults, ops: tokenType[] | [tokenType, string][], funcB=func): ParseResults {
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

    private makeFunctionCall (to: Node) {
        const res = new ParseResults();
        let args: Node[] = [];
        const pos = this.currentToken.pos;

        if (this.currentToken.type !== tt.OPAREN) {
            return res.failure(new InvalidSyntaxError(
                pos,
                "Expected '['"
            ));
        }

        this.advance(res);

        // @ts-ignore
        if (this.currentToken.type === tt.CPAREN) {
            this.advance(res);
            return res.success(new n.N_functionCall(pos, to, []));
        }

        args.push(res.register(this.expr()));
        if (res.error) return res.failure(new InvalidSyntaxError(
            this.currentToken.pos,
            "Invalid argument"
        ));

        // @ts-ignore
        while (this.currentToken.type === tt.COMMA) {
            this.advance(res);

            args.push(res.register(this.expr()));
            if (res.error) return res;
        }

        // @ts-ignore
        if (this.currentToken.type !== tt.CPAREN)
            return res.failure(new InvalidSyntaxError(
                this.currentToken.pos,
                "Expected ',' or ')'"
            ));

        this.advance(res);

        return res.success(new n.N_functionCall(pos, to, args));
    }

    private makeIndex (to: Node) {
        const res = new ParseResults();
        const pos = this.currentToken.pos;

        const base = to;

        if (this.currentToken.type !== tt.OSQUARE)
            return res.failure(new InvalidSyntaxError(
                pos,
                "Expected '["
            ));

        this.advance(res);

        // @ts-ignore
        if (this.currentToken.type === tt.CSQUARE) {
            return res.failure(new InvalidSyntaxError(
                pos,
                `Cannot index without expression`
            ));
        }

        let index = res.register(this.expr());
        if (res.error) return res.failure(new InvalidSyntaxError(
            this.currentToken.pos,
            "Invalid index"
        ));

        // @ts-ignore
        if (this.currentToken.type !== tt.CSQUARE)
            return res.failure(new InvalidSyntaxError(
                this.currentToken.pos,
                "Expected ']'"
            ));

        this.advance(res);

        return res.success(new n.N_indexed(
            pos,
            base,
            index
        ));
    }

    private typeExpr (res: ParseResults) {
        if (this.currentToken.type === tt.IDENTIFIER) {
            const tok = this.currentToken;
            this.advance(res);
            return res.success(new N_variable(tok));
        }
        return this.expr();
    }

    private destructuring (pos: Position, isConst: boolean, isGlobal: boolean): ParseResults {
        const res = new ParseResults();

        this.advance(res);
        if (res.error) return res;

        let identifiers: Token<string>[] = [];
        let typeNodes: Node[] = [];

        // @ts-ignore
        if (this.currentToken.type === tt.CSQUARE) {
            // empty
            this.consume(res, tt.CSQUARE);

            if (!this.currentToken.matches(tt.ASSIGN, '=')) {
                return res.failure(new InvalidSyntaxError(this.currentToken.pos, `Expected '='`))
            }

            this.consume(res, tt.ASSIGN);

            let expr = res.register(this.expr());
            if (res.error) return res;

            return res.success(new n.N_arrayDestructAssign(
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
                return res.failure(new InvalidSyntaxError(this.currentToken.pos, `Expected identifier`));
            }

            identifiers.push(this.currentToken);
            this.advance(res);

            // @ts-ignore
            if (this.currentToken.type === tt.COLON) {
                this.consume(res, tt.COLON);
                let tRes = res.register(this.typeExpr(res));
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
            return res.failure(new InvalidSyntaxError(this.currentToken.pos, `Expected '='`))
        }

        this.consume(res, tt.ASSIGN);

        let expr = res.register(this.expr());
        if (res.error) return res;

        return res.success(new n.N_arrayDestructAssign(
            pos,
            identifiers.map(i => i.value),
            typeNodes,
            expr,
            isGlobal,
            isConst
        ));
    }

    private initiateVar (res: ParseResults): ParseResults {
        let pos = this.currentToken.pos;

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
                this.currentToken.pos,
                `Expected variable declaration keyword, not ${this.currentToken.value}`
            ));
        }

        if (this.currentToken.type === tt.OSQUARE) {
            return this.destructuring(pos, isConst, isGlobal);
        }

        // @ts-ignore
        if (this.currentToken.type !== tokenType.IDENTIFIER) {
            return res.failure(new InvalidSyntaxError(
                this.currentToken.pos,
                `Expected Identifier, '[' or '{'`
            ));
        }

        const varName = this.currentToken;
        this.advance(res);

        let type: n.Node | ESType = types.any;

        // @ts-ignore
        if (this.currentToken.type === tt.COLON) {
            isDeclaration = true;
            this.consume(res, tt.COLON);
            type = res.register(this.typeExpr(res));
        }

        // @ts-ignore doesn't like two different comparisons after each other with different values
        if (this.currentToken.type !== tt.ASSIGN) {
            if (isConst)
                return res.failure(new InvalidSyntaxError(
                    pos,
                    'Cannot initialise constant to undefined'
                ));

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

        let assignType = this.currentToken.value;

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

    private bracesExp (): ParseResults {
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

    private addEndStatement (res: ParseResults) {
        this.tokens.splice(this.tokenIdx, 0, new Token(
            this.currentToken.pos,
            tt.ENDSTATEMENT,
            undefined
        ));
        this.reverse();
        this.advance(res);
    }

    private ifExpr (): ParseResults {
        const res = new ParseResults();
        let ifTrue;
        let ifFalse;
        let condition;

        const pos = this.currentToken.pos;

        if (!this.currentToken.matches(tt.KEYWORD, 'if'))
            return res.failure(new InvalidSyntaxError(
                this.currentToken.pos,
                "Expected 'if'"
            ));

        this.advance(res);

        condition = res.register(this.expr());
        if (res.error) return res;


        ifTrue = res.register(this.bracesExp());
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

    private whileExpr (): ParseResults {
        const res = new ParseResults();
        let loop;
        let condition;
        const pos = this.currentToken.pos;

        if (!this.currentToken.matches(tt.KEYWORD, 'while')) {
            return res.failure(new InvalidSyntaxError(
                this.currentToken.pos,
                "Expected 'while'"
            ));
        }

        this.advance(res);

        condition = res.register(this.expr());
        if (res.error) return res;

       loop = res.register(this.bracesExp());
       if (res.error) return res;

       this.addEndStatement(res);

        return res.success(new n.N_while(pos, condition, loop));
    }

    /**
     * Gets the __name__ and __type__ of a parameter, for example `arg1: number`
     */
    private parameter (res: ParseResults): uninterpretedArgument | ESError {
        let name: string;
        let type: Node = new n.N_primitiveWrapper(types.any);
        let defaultValue: Node | undefined;

        if (this.currentToken.type !== tt.IDENTIFIER) {
            return new InvalidSyntaxError(
                this.currentToken.pos,
                "Expected identifier"
            );
        }

        name = this.currentToken.value;

        this.advance(res);

        // @ts-ignore
        if (this.currentToken.type === tt.COLON) {
            this.consume(res, tt.COLON);
            if (res.error) return res.error;

            type = res.register(this.typeExpr(res));
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
            defaultValue
        };
    }

    /**
     * () {} part of the function or method
     */
    private funcCore (): ParseResults {
        const res = new ParseResults();
        const pos = this.currentToken.pos;
        let body: n.Node,
            args: uninterpretedArgument[] = [],
            returnType: Node = new n.N_primitiveWrapper(types.any);

        this.consume(res, tt.OPAREN);

        // @ts-ignore
        if (this.currentToken.type === tt.CPAREN) {
            this.advance(res);

        } else {
            let param = this.parameter(res);
            if (param instanceof ESError) {
                return res.failure(param);
            }
            args.push(param);

            let usingDefault = args[0].defaultValue !== undefined;

            // @ts-ignore
            while (this.currentToken.type === tt.COMMA) {
                this.advance(res);

                let paramStart = this.currentToken.pos;

                let param = this.parameter(res);
                if (param instanceof ESError) {
                    return res.failure(param);
                }
                if (args.filter(a => a.name === param.name).length) {
                    return res.failure(new InvalidSyntaxError(
                        paramStart, `Cannot have two parameters with the same name`));
                }
                if (usingDefault && !param.defaultValue) {
                    return res.failure(new InvalidSyntaxError(
                        this.currentToken.pos, 'Must use default parameter here'));
                }
                if (!usingDefault && param.defaultValue) {
                    usingDefault = true;
                }
                args.push(param);
            }

            // @ts-ignore
            if (this.currentToken.type !== tt.CPAREN)
                return res.failure(new InvalidSyntaxError(
                    this.currentToken.pos,
                    "Expected ',' or ')'"
                ));

            this.advance(res);
        }

        // @ts-ignore
        if (this.currentToken.type === tt.COLON) {
            this.advance(res);

            returnType = res.register(this.typeExpr(res));
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

        return res.success(new n.N_functionDefinition(pos, body, args, returnType));
    }

    private funcExpr (): ParseResults {
        const res = new ParseResults();
        let name: string | undefined;

        if (!this.currentToken.matches(tt.KEYWORD, 'func')) {
            return res.failure(new InvalidSyntaxError(
                this.currentToken.pos,
                "Expected 'func'"
            ));
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

    private classExpr (name?: string): ParseResults {
        const res = new ParseResults();
        const pos = this.currentToken.pos;
        const methods: n.N_functionDefinition[] = [];
        let init: n.N_functionDefinition | undefined;
        let extends_: n.Node = new N_primitiveWrapper(types.object);
        let identifier: string | undefined;

        if (!this.currentToken.matches(tt.KEYWORD, 'class')) {
            return res.failure(new InvalidSyntaxError(
                this.currentToken.pos, "Expected 'class'"));
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
                extends_,
                undefined,
                name,
                identifier !== undefined
            ));
        }

        while (this.currentToken.type === tt.IDENTIFIER) {

            let methodId = this.currentToken.value;
            this.advance(res);

            const func = res.register(this.funcCore());
            if (res.error) return res;
            if (!(func instanceof N_functionDefinition)) {
                return res.failure(new ESError(this.currentToken.pos, 'ParseError',
                    `Tried to get function, but got ${func} instead`));
            }

            func.name = methodId;

            if (methodId === 'init') {
                init = func;
            } else {
                methods.push(func);
            }
        }

        this.consume(res, tt.CBRACES);

        return res.success(new n.N_class(
            pos,
            methods,
            extends_,
            init,
            name
        ));
    }

    private forExpr (): ParseResults {
        const res = new ParseResults();
        const pos = this.currentToken.pos;
        let body: n.Node,
            array: n.Node,
            identifier: Token<any>,
            isConst = true;

        if (!this.currentToken.matches(tt.KEYWORD, 'for')) {
            return res.failure(new InvalidSyntaxError(
                this.currentToken.pos,
                "Expected 'for'"
            ));
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
                this.currentToken.pos,
                "Expected identifier"
            ));
        }

        identifier = this.currentToken;

        this.advance(res);

        if (!this.currentToken.matches(tt.KEYWORD, 'in')) {
            return res.failure(new InvalidSyntaxError(
                this.currentToken.pos,
                "Expected keyword 'in"
            ));
        }

        this.advance(res);

        array = res.register(this.expr());
        if (res.error) return res;

        body = res.register(this.bracesExp());
        if (res.error) return res;

        this.addEndStatement(res);
        if (res.error) return res;

        return res.success(new n.N_for(
            pos, body, array, identifier, false, isConst
        ));
    }

    private array () {
        const res = new ParseResults();
        let elements: Node[] = [];
        const pos = this.currentToken.pos;

        if (this.currentToken.type !== tt.OSQUARE) {
            return res.failure(new InvalidSyntaxError(
                pos,
                "Expected '["
            ));
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
                this.currentToken.pos,
                "Unexpected token"
            ));
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
                this.currentToken.pos,
                "Expected ',' or ']'"
            ));
        }

        this.advance(res);

        return res.success(new n.N_array(pos, elements));
    }

    private object () {
        const res = new ParseResults();
        let properties: [Node, Node][] = [];
        const pos = this.currentToken.pos;

        if (this.currentToken.type !== tt.OBRACES) {
            return res.failure(new InvalidSyntaxError(
                pos,
                "Expected '{"
            ));
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
                        this.currentToken.pos,
                        `Expected ']', got '${tokenTypeString[this.currentToken.type]}'`
                    ));
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
                        this.currentToken.pos,
                        `Expected ',' or '}', got '${tokenTypeString[this.currentToken.type]}'`
                    ));
                }

                if (this.currentToken.type === tt.COMMA) {
                    this.advance(res);
                }

            } else {
                if (this.currentToken.type !== tt.COMMA && this.currentToken.type !== tt.CBRACES) {
                    return res.failure(new InvalidSyntaxError(
                        this.currentToken.pos,
                        `Expected ',' or '}', got '${tokenTypeString[this.currentToken.type]}'`
                    ));
                }

                if (keyType !== 'id') {
                    return res.failure(new InvalidSyntaxError(
                        this.currentToken.pos,
                        `You must specify a value when initialising an object literal with a key that is not an identifier.
                        Try using \`key: value\` syntax.`
                    ));
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
        if (this.currentToken.type !== tt.CBRACES)
            return res.failure(new InvalidSyntaxError(
                this.currentToken.pos,
                "Expected identifier, ',' or '}'"
            ));

        this.advance(res);

        return res.success(new n.N_objectLiteral(pos, properties));
    }

    private namespace () {
        const res = new ParseResults();
        const pos = this.currentToken.pos;

        this.consume(res, tt.KEYWORD);
        if (res.error) return res;
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

        return res.success(new n.N_namespace(pos, statements));
    }

    private tryCatch (): ParseResults {
        const res = new ParseResults();

        this.consume(res, tt.KEYWORD);
        if (res.error) return res;
        this.consume(res, tt.OBRACES);
        if (res.error) return res;

        if (this.currentToken.type === tt.CBRACES) {
            return res.failure(new InvalidSyntaxError(this.currentToken.pos, 'No empty try block'));
        }

        const body = res.register(this.statements());
        if (res.error) return res;

        this.consume(res, tt.CBRACES);
        if (res.error) return res;

        if (this.currentToken.value !== 'catch') {
            return res.failure(new InvalidSyntaxError(this.currentToken.pos, 'try block requires catch'));
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
