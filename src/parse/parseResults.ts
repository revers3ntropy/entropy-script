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
        if (!res.node) {
            return new N_undefined();
        }
        return res.node;
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

    failure (error: Error): ParseResults {
        this.error = error;
        return this;
    }
}