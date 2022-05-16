import type { NativeModuleBuilder } from '../module';

const module: NativeModuleBuilder = () => {
    // simply return the global RegExp object
    return RegExp;
}

export default module;