import {str} from '../../util/util';
import { NativeModuleBuilder } from "../module";

const module: NativeModuleBuilder = () => ({
    asciiToChar: (num: any) => {
        if (typeof num !== 'number') {
            throw new TypeError(`number`);
        }
        return String.fromCharCode(num);
    },

    charToAscii: (char: any) => {
        if (typeof char !== 'number') {
            throw new TypeError(`number`);
        }
        return str(char).charCodeAt(0);
    },
});

export default module;