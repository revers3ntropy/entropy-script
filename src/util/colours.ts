import { IS_NODE_INSTANCE } from "./constants";
import type {Map} from './util';

const codes: Map<number> = {
    red: 31,
    yellow: 33,
    green: 32,
    cyan: 36,
    blue: 34,
    grey: 2
};

const c: Map<(s: string | undefined) => string> = {};

for (const code of Object.keys(codes)) {
    c[code] = (s: string | undefined) => {
        s ||= '';
        if (IS_NODE_INSTANCE) {
            return `\x1b[${codes[code]}m` + s + '\x1b[0m';
        }
        return `<span style="color: ${code}">${s}</span>`;
    }
}

export default c;