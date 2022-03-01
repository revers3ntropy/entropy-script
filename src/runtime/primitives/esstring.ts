import {ESError, TypeError} from '../../errors';
import {Position} from '../../position';
import {Context} from '../context';
import { funcProps, str } from '../../util/util';

import {ESArray} from './esarray';
import {ESBoolean} from './esboolean';
import {ESNumber} from './esnumber';
import {ESPrimitive} from './esprimitive';
import {Primitive, types} from './primitive';
import {wrap} from './wrapStrip';
import { ESFunction } from "./esfunction";


export class ESString extends ESPrimitive <string> {
    constructor (value: string = '') {
        super(value, types.string);
    }

    str = () => this;

    cast = ({}, type: Primitive): Primitive | ESError => {
        switch (type) {
        case types.number:
            const num = parseFloat(this.valueOf());
            if (isNaN(num))
                return new ESError(Position.unknown, 'TypeError', `This string is not a valid number`);
            return new ESNumber(num);
        case types.string:
            return this;
        case types.array:
            return new ESArray(this.valueOf().split('').map(s => new ESString(s)));
        default:
            return new ESError(Position.unknown, 'TypeError', `Cannot cast to type '${str(type.typeName())}'`);
        }
    }

    __add__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESString))
            return new TypeError(Position.unknown, 'String', n.typeName().valueOf(), n.valueOf());
        return new ESString(this.valueOf() + n.valueOf());
    };
    __multiply__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.unknown, 'Number', n.typeName().valueOf(), n.valueOf());
        return new ESString(this.valueOf().repeat(n.valueOf()));
    };
    __eq__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESString))
            return new ESBoolean(false);
        return new ESBoolean(this.valueOf() === n.valueOf());
    };
    __gt__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESString))
            return new TypeError(Position.unknown, 'String', n.typeName().valueOf(), n.valueOf());
        return new ESBoolean(this.valueOf().length > n.valueOf().length);
    };
    __lt__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESString))
            return new TypeError(Position.unknown, 'String', n.typeName().valueOf(), n.valueOf());
        return new ESBoolean(this.valueOf().length < n.valueOf().length);
    };

    __bool__ = () => new ESBoolean(this.valueOf().length > 0);
    bool = this.__bool__;


    len = () => {
        return new ESNumber(this.valueOf().length);
    }
    clone = () => new ESString(this.valueOf());

    __getProperty__ = (props: funcProps, key: Primitive): Primitive => {
        if (key instanceof ESString && this.self.hasOwnProperty(str(key))) {
            const val = this.self[str(key)];
            if (typeof val === 'function') {
                return new ESFunction(val);
            }
            return wrap(val);
        }

        if (!(key instanceof ESNumber)) {
            return new ESString();
        }

        let idx = key.valueOf();

        while (idx < 0) {
            idx = this.valueOf().length + idx;
        }

        if (idx < this.valueOf().length) {
            return new ESString(this.valueOf()[idx]);
        }

        return new ESString();
    };

    __setProperty__(props: funcProps, key: Primitive, value: Primitive): void {
        if (!(key instanceof ESNumber))
            return;

        if (!(value instanceof ESString))
            value = new ESString(str(value));

        let idx = key.valueOf();

        while (idx < 0)
            idx = this.valueOf().length + idx;

        const strToInsert = value.str().valueOf();

        let firstPart = this.__value__.substr(0, idx);
        let lastPart = this.__value__.substr(idx + strToInsert.length);

        this.__value__ = firstPart + strToInsert + lastPart;
    }
}
