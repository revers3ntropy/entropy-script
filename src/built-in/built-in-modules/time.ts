import {now} from '../../util/constants.js';
import type {NativeModuleBuilder } from '../module';

const module: NativeModuleBuilder = () => ({
    now,
    date: Date
});

export default module;