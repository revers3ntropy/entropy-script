import {str} from '../../util/util';
import { NativeModuleBuilder } from "../module";

const module: NativeModuleBuilder = () => ({
    parse: (json: unknown) => {
        return JSON.parse(str(json));
    },

    stringify: JSON.stringify
});

export default module;