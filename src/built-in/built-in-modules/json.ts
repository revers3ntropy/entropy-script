
import {strip} from '../../runtime/primitives/wrapStrip';
import {str} from '../../util/util';
import { global } from "../../constants";

const module: any = {

    parse: (json: any) => {
        return JSON.parse(str(json));
    },

    stringify: (json: any) => {
        return JSON.stringify(strip(json, { context: global }));
    }
};

export default module;