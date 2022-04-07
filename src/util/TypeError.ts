import {Error} from '../errors';
import Position from '../position';
import type {Primitive} from '../runtime/primitive';
import {funcProps, str} from './util';

/**
 * Recursively checks properties until it finds an invalid match
 */
function getWhyTypesAreInvalid (props: funcProps, expected: Primitive, got: Primitive): string | true {
    const reason = 'something';
    for (const k of expected.keys(props)) {

    }
    if (reason === '') return true;
    return `Type '${got.__type_name__()}' is incompatible with type '${str(expected)}':\n` + reason;
}

export default function (props: funcProps, expectedType: Primitive, value: Primitive, msg='') {
    let reason = getWhyTypesAreInvalid(props, expectedType, value);
    if (reason === true) {
        reason = 'It... seem to be alright...';
    }
    return new Error('TypeError',  reason+ '\n' + msg);
}