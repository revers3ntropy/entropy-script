import {IS_NODE_INSTANCE} from '../../constants';
import {ESError, InvalidRuntimeError, PermissionRequiredError, TypeError} from '../../errors';
import { JSModule, JSModuleFunc } from '../module';
import { ESJSBinding } from "../../runtime/primitives/esjsbinding";
import { config } from "../../config";
import { Position } from "../../position";

const module: JSModuleFunc = (): JSModule | ESError => {

    if (!config.permissions.accessDOM) {
        return new PermissionRequiredError('No access to DOM');
    }

    if (IS_NODE_INSTANCE) {
        return new InvalidRuntimeError();
    }

    const w: { [k: string]: any; } | undefined = window;

    if (typeof w === 'undefined') {
        return new TypeError(Position.void, 'Object', 'undefined', 'window', 'Window is undefined! ES expected to be in a browser.');
    }

    if (!('$' in w)) {
        return {
            window: new ESJSBinding(w, 'window'),
            document: new ESJSBinding(w['document'], 'document'),
        };
    }


    const $: any = new ESJSBinding(w['$'], 'jquery');

    return {
        $,
        window: new ESJSBinding(w, 'window'),
        document: new ESJSBinding(w['document'], 'document'),
    };
}

export default module;