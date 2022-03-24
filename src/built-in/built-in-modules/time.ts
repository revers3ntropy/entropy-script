import {now} from '../../constants';
import type {NativeModuleBuilder } from '../module';

const module: NativeModuleBuilder = () => ({
    now,
    date: Date
});

export default module;