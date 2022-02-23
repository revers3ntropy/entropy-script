import {IS_NODE_INSTANCE} from '../../constants.js';
import { ESError, ReferenceError, InvalidRuntimeError } from '../../errors.js';
import {Position} from '../../position.js';
import { JSModule, JSModuleFunc } from '../module.js';
import { ESJSBinding } from "../../runtime/primitives/esjsbinding.js";

const module: JSModuleFunc = (): JSModule | ESError => {

    if (IS_NODE_INSTANCE) {
        return new InvalidRuntimeError();
    }

    if (typeof window === 'undefined' || !('$' in window)) {
        return new ReferenceError(Position.unknown, '$ must be property of window to use dom library');
    }

    const $: any = new ESJSBinding(window.$, 'jquery');

    return {
        $,
        window: new ESJSBinding(window, 'window'),
        document: new ESJSBinding(window.document, 'document'),
    };
}

export default module;