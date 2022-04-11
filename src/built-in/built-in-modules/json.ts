import { NativeModuleBuilder } from "../module";
import { str } from "../../util/util";

const module: NativeModuleBuilder = () => ({
    parse: (json: unknown) => {
        return JSON.parse(str(json));
    },

    stringify: JSON.stringify
});

export default module;