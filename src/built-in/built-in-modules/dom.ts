import {IS_NODE_INSTANCE} from '../../util/constants';
import {Error, InvalidRuntimeError, PermissionRequiredError, TypeError} from '../../errors';
import { NativeModule, NativeModuleBuilder } from '../module';
import { ESJSBinding } from "../../runtime/primitives/jsbinding";
import { Config } from "../../config";

const module: NativeModuleBuilder = (): NativeModule | Error => {

    if (!config.permissions.accessDOM) {
        return new PermissionRequiredError('No access to DOM');
    }

    if (IS_NODE_INSTANCE) {
        return new InvalidRuntimeError();
    }

    const w: (Window & typeof globalThis & {$?: unknown}) | undefined = window;

    if (typeof w === 'undefined') {
        return new TypeError('Object', 'undefined', 'window', 'Window is undefined! ES expected to be in a browser.');
    }

    if (!('$' in w)) {
        return {
            window: new ESJSBinding(w, 'window'),
            document: new ESJSBinding(w['document'], 'document'),
        };
    }


    const $ = new ESJSBinding(w.$, 'jquery');

    return {
        $,
        window: new ESJSBinding(w, 'window'),
        document: new ESJSBinding(w['document'], 'document'),
    };
}

export default module;