import { ESError, ReferenceError } from '../../errors.js';
import {Position} from '../../position.js';
import { JSModule, JSModuleFunc } from '../module.js';
import { ESJSBinding } from "../../runtime/primitives/esjsbinding.js";

const module: JSModuleFunc = (): JSModule | ESError => {

    if (typeof window === 'undefined' || !('$' in window)) {
        return new ReferenceError(Position.unknown, '$ must be property of window to use dom library');
    }

    const $: any = new ESJSBinding(window.$, 'jquery');

    return { $ };
}

export default module;