import {ReferenceError} from '../../errors.js';
import {Position} from '../../position.js';
import {wrap} from '../../runtime/primitives/wrapStrip.js';
import {JSModuleFunc} from '../module.js';

const module: JSModuleFunc = () => {

    let $;
    if ('$' in window) {
        $ = window.$;
    } else {
        return new ReferenceError(Position.unknown, '$ must be property of window to use dom library');
    }

    return {
        $: wrap($, true)
    };
}

export default module;