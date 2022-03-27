import { NativeModuleBuilder } from "../module";

type promiseCB = (
        resolve: (value: any) => void,
        error: (err: any) => void
    ) => void;

type then = (value: any) => void;

const module: NativeModuleBuilder = () => (class {

    thens: then[] = [];
    catch_: then | undefined;
    resolved = false;

    constructor (cb: promiseCB) {
        if (typeof cb !== "function") {
            return;
        }
        cb((value) => {
            if (this.resolved) {
                return;
            }
            this.resolved = true;
            for (let then of this.thens) {
                if (typeof then === "function") {
                    then(value);
                }
            }
        }, (error) => {
            if (this.resolved) {
                return;
            }
            this.resolved = true;
            if (this.catch_) {
                if (typeof this.catch_ === "function") {
                    this.catch_(error);
                }
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
});

export default module;