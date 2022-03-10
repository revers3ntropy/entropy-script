import {ESError, TypeError} from '../../errors';
import {Position} from '../../position';
import { funcProps, str } from '../../util/util';
import {ESArray} from './esarray';
import {ESBoolean} from './esboolean';
import {ESNumber} from './esnumber';
import {ESPrimitive} from './esprimitive';
import {Primitive, types} from './primitive';
import {wrap} from './wrapStrip';

export class ESString extends ESPrimitive <string> {
    constructor (value: string = '') {
        super(value, types.string);
    }

    override str = () => this;

    override cast = ({}, type: Primitive): Primitive | ESError => {
        switch (type) {
        case types.number:
            const num = parseFloat(this.valueOf());
            if (isNaN(num))
                return new ESError(Position.void, 'TypeError', `This string is not a valid number`);
            return new ESNumber(num);
        case types.string:
            return this;
        case types.array:
            return new ESArray(this.valueOf().split('').map(s => new ESString(s)));
        default:
            return new ESError(Position.void, 'TypeError', `Cannot cast to type '${str(type.typeName())}'`);
        }
    }

    override __add__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESString))
            return new TypeError(Position.void, 'String', n.typeName().valueOf(), n.valueOf());
        return new ESString(this.valueOf() + n.valueOf());
    };
    override __multiply__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESNumber))
            return new TypeError(Position.void, 'Number', n.typeName().valueOf(), n.valueOf());
        return new ESString(this.valueOf().repeat(n.valueOf()));
    };
    override __eq__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESString))
            return new ESBoolean(false);
        return new ESBoolean(this.valueOf() === n.valueOf());
    };
    override __gt__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESString))
            return new TypeError(Position.void, 'String', n.typeName().valueOf(), n.valueOf());
        return new ESBoolean(this.valueOf().length > n.valueOf().length);
    };
    override __lt__ = (props: funcProps, n: Primitive) => {
        if (!(n instanceof ESString))
            return new TypeError(Position.void, 'String', n.typeName().valueOf(), n.valueOf());
        return new ESBoolean(this.valueOf().length < n.valueOf().length);
    };

    override __bool__ = () => new ESBoolean(this.valueOf().length > 0);
    override bool = this.__bool__;


    len = () => {
        return new ESNumber(this.valueOf().length);
    }
    clone = () => new ESString(this.valueOf());

    override __getProperty__ = (props: funcProps, key: Primitive): Primitive => {
        if (key instanceof ESString && this.self.hasOwnProperty(str(key))) {
            return wrap(this.self[str(key)], true);
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

    override __setProperty__(props: funcProps, key: Primitive, value: Primitive): void {
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

    override typeCheck = this.__eq__;
}
