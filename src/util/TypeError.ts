import {Error} from '../errors.js';
import Position from '../position.js';
import type {Primitive} from '../runtime/primitive.js';
import {funcProps, str} from './util.js';

/**
 * Recursively checks properties until it finds an invalid match
 */
function getWhyTypesAreInvalid (props: funcProps, expected: Primitive, got: Primitive): string | true {
    let reason = 'something';
    for (let k of expected.keys(props)) {

    }
    if (reason === '') return true;
    return `Type '${got.__type_name__()}' is incompatible with type '${str(expected)}':\n` + reason;
}

export default function (props: funcProps, expectedType: Primitive, value: Primitive, msg='') {
    let reason = getWhyTypesAreInvalid(props, expectedType, value);
    if (reason === true) {
        reason = 'It... seem to be alright...';
    }
    return new Error(Position.void, 'TypeError',  reason+ '\n' + msg);
};