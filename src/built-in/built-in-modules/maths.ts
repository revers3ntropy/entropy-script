import type {JSModule} from 'module.js';
import {Position} from '../../position.js';
import {ESNumber} from '../../runtime/primitiveTypes.js';
import {TypeError} from '../../errors.js';
import {str} from '../../util/util.js';

const module: JSModule = {
    E: Math.E,
    LN10: Math.LN10,
    LN2: Math.LN2,
    LOG2E: Math.LOG2E,
    LOG10E: Math.LOG10E,
    PI: Math.PI,
    SQRT1_2: Math.SQRT1_2,
    SQRT2: Math.SQRT2,

    abs: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.abs(n.valueOf()));
    },
    acos: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.acos(n.valueOf()));
    },
    acosh: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.acosh(n.valueOf()));
    },
    asin: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.asin(n.valueOf()));
    },
    asinh: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.asinh(n.valueOf()));
    },
    atan: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.atan(n.valueOf()));
    },
    atan2: ({}, y, x) => {
        if (!(x instanceof ESNumber))
        return new TypeError(Position.unknown, 'number', str(x.typeName()), str(x));
        if (!(y instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(y.typeName()), str(y));
        return new ESNumber(Math.atan2(y.valueOf(), x.valueOf()));
    },
    atanh: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.atanh(n.valueOf()));
    },
    cbrt: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.cbrt(n.valueOf()));
    },
    ceil: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.ceil(n.valueOf()));
    },
    clz32: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.clz32(n.valueOf()));
    },
    cos: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.cos(n.valueOf()));
    },
    cosh: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.cosh(n.valueOf()));
    },
    exp: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.exp(n.valueOf()));
    },
    expm1: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.expm1(n.valueOf()));
    },
    floor: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.floor(n.valueOf()));
    },
    fround: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.fround(n.valueOf()));
    },
    hypot: ({}, ...values) => {
        for (let n of values)
            if (!(n instanceof ESNumber))
                return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.hypot(...values.map(n => n.valueOf())));
    },
    imul: ({}, x, y) => {
        if (!(x instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(x.typeName()), str(x));
        if (!(y instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(y.typeName()), str(y));
        return new ESNumber(Math.imul(x.valueOf(), y.valueOf()));
    },
    log: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.log(n.valueOf()));
    },
    log10: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.log10(n.valueOf()));
    },
    log1p: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.log1p(n.valueOf()));
    },
    log2: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.log2(n.valueOf()));
    },
    min: ({}, x, y) => {
        if (!(x instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(x.typeName()), str(x));
        if (!(y instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(y.typeName()), str(y));
        return new ESNumber(Math.min(x.valueOf(), y.valueOf()));
    },
    max: ({}, x, y) => {
        if (!(x instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(x.typeName()), str(x));
        if (!(y instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(y.typeName()), str(y));
        return new ESNumber(Math.max(x.valueOf(), y.valueOf()));
    },
    pow: ({}, x, y) => {
        if (!(x instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(x.typeName()), str(x));
        if (!(y instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(y.typeName()), str(y));
        return new ESNumber(Math.pow(x.valueOf(), y.valueOf()));
    },
    random: ({}) => {
        return new ESNumber(Math.random());
    },
    randInt: ({}, min, max) => {
        if (!(min instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(min.typeName()), str(min));
        if (!(max instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(max.typeName()), str(max));
        const min_ = Math.ceil(min.valueOf());
        const max_ = Math.floor(max.valueOf());
        return new ESNumber(Math.floor(Math.random() * (max_ - min_) + min_));
    },
    round: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.round(n.valueOf()));
    },
    sin: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.sin(n.valueOf()));
    },
    sinh: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.sinh(n.valueOf()));
    },
    sqrt: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.sqrt(n.valueOf()));
    },
    tan: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.tan(n.valueOf()));
    },
    tanh: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.tanh(n.valueOf()));
    },
    trunc: ({}, n) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'number', str(n.typeName()), str(n));
        return new ESNumber(Math.trunc(n.valueOf()));
    },
};

export default module;