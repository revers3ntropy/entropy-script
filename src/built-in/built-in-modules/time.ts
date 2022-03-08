import {now} from '../../constants';
import {ESFunction} from '../../runtime/primitives/esfunction';
import {ESJSBinding} from '../../runtime/primitives/esjsbinding';
import {ESNumber} from '../../runtime/primitives/esnumber';
import type {JSModuleFunc} from '../module';

const module: JSModuleFunc = (config) => ({
    now: new ESFunction(() => new ESNumber(now())),
    date: new ESJSBinding(Date)
});

export default module;