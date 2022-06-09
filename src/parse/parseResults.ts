import Position from '../position';
import * as n from "../runtime/nodes";
import { Error } from "../errors";
import { N_undefined } from "../runtime/nodes";

export class ParseResults {
    public node?: n.Node;
    public error?: Error;

    public reverseCount: number;
    public lastRegisteredAdvanceCount: number;
    public advanceCount: number;

    constructor () {
        this.advanceCount = 0;
        this.lastRegisteredAdvanceCount = 0;
        this.reverseCount = 0;
    }

    public registerAdvance (): void {
        this.advanceCount = 1;
        this.lastRegisteredAdvanceCount++;
    }

    public register (res: ParseResults): n.Node {
        this.lastRegisteredAdvanceCount = res.advanceCount;
        this.advanceCount += res.advanceCount;
        if (res.error) {
            this.error = res.error;
        }
        return res.node || new N_undefined();
    }

    public tryRegister (res: ParseResults) {
        if (res.error) {
            this.reverseCount += res.advanceCount;
            return;
        }
        return this.register(res);
    }

    public success (node: n.Node): ParseResults {
        this.node = node;
        return this;
    }

    public failure (error: Error, pos?: Position): ParseResults {
        this.error = error;
        if (pos) {
            this.error.pos = pos;
        }
        return this;
    }
}