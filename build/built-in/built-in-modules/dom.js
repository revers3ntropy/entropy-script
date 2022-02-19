import { ReferenceError } from '../../errors.js';
import { Position } from '../../position.js';
import { ESJSBinding } from "../../runtime/primitives/esjsbinding.js";
const module = () => {
    if (typeof window === 'undefined' || !('$' in window)) {
        return new ReferenceError(Position.unknown, '$ must be property of window to use dom library');
    }
    const $ = new ESJSBinding(window.$, 'jquery');
    return { $ };
};
export default module;
