import {Error} from '../errors';
import { IFuncProps, Primitive, str } from './util';

/**
 * Recursively checks properties until it finds an invalid match
 */
function getWhyTypesAreInvalid (props: IFuncProps, expected: Primitive, got: Primitive): string | true {
    const reason = 'something';
    // for (const k of expected.keys(props)) {
    //
    // }
    // @ts-ignore
    if (reason === '') return true;
    return `Type '${got.__type_name__()}' is incompatible with type '${str(expected)}':\n` + reason;
}

export default function (props: IFuncProps, expectedType: Primitive, value: Primitive, msg='') {
    let reason = getWhyTypesAreInvalid(props, expectedType, value);
    if (reason === true) {
        reason = 'It... seem to be alright...';
    }
    return new Error('TypeError',  reason+ '\n' + msg);
}