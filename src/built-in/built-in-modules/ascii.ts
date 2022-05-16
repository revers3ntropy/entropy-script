import { NativeModuleBuilder } from "../module";
import { str } from "../../util/util";

const module: NativeModuleBuilder = () => ({

    asciiToChar: (num: unknown) => {
        if (typeof num !== 'number') {
            throw new TypeError(`number`);
        }
        return String.fromCharCode(num);
    },

    charToAscii: (char: unknown) => {
        if (typeof char !== 'number') {
            throw new TypeError(`number`);
        }
        return str(char).charCodeAt(0);
    },
});

export default module;