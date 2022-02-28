type promiseCB = (
        resolve: (value: any) => void,
        error: (err: any) => void
    ) => void;

type then = (value: any) => void;

export default class {

    thens: then[] = [];
    catch_: then | undefined;
    resolved = false;

    constructor (cb: promiseCB) {
        cb((value) => {
            this.resolved = true;
            for (let then of this.thens) {
                then(value);
            }
        }, (error) => {
            this.resolved = true;
            if (this.catch_) {
                this.catch_(error);
            }
        });
    }

    then (cb: then) {
        if (this.resolved) {
            return;
        }
        this.thens.push(cb);
        return this;
    }

    catch (cb: then) {
        if (this.resolved) {
            return;
        }
        this.catch_ = cb;
        return this;
    }

};