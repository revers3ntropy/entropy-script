import Position from '../position';
import * as n from "../runtime/nodes";
import { Error } from "../errors";
import { N_undefined } from "../runtime/nodes";

export class ParseResults {
    node: n.Node | undefined;
    error: Error | undefined;

    reverseCount: number;
    lastRegisteredAdvanceCount: number;
    advanceCount: number;

    constructor () {
        this.advanceCount = 0;
        this.lastRegisteredAdvanceCount = 0;
        this.reverseCount = 0;
    }

    registerAdvance (): void {
        this.advanceCount = 1;
        this.lastRegisteredAdvanceCount++;
    }

    register (res: ParseResults): n.Node {
        this.lastRegisteredAdvanceCount = res.advanceCount;
        this.advanceCount += res.advanceCount;
        if (res.error) {
            this.error = res.error;
        }
        return res.node || new N_undefined();
    }

    tryRegister (res: ParseResults) {
        if (res.error) {
            this.reverseCount += res.advanceCount;
            return;
        }
        return this.register(res);
    }

    success (node: n.Node): ParseResults {
        this.node = node;
        return this;
    }

    failure (error: Error, pos = Position.void): ParseResults {
        this.error = error;
        this.error.pos = pos;
        return this;
    }
}