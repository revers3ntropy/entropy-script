import { IFuncProps } from "../../util/util";
import { Primitive } from "../primitive";
import { ESBoolean } from "./boolean";
import { Error, TypeError } from "../../errors";
import { ESNull } from "./null";
import { types } from "../../util/constants";
import { ESNumber } from "./number";
import { ESString } from "./string";
import { ESObject } from "./object";
import {str} from "../../util/util";

export class ESInterface extends ESObject {
    override __includes__ = (props: IFuncProps, n: Primitive): ESBoolean | Error => {
        for (const key of Object.keys(this.__value__)) {
            const thisType = this.__value__[key];
            const nValue = n.__value__[key] ?? new ESNull();

            const typeCheckRes = thisType.__includes__(props, nValue);
            if (typeCheckRes instanceof Error) return typeCheckRes;
            if (!typeCheckRes.__value__) {
                return new ESBoolean();
            }
        }

        return new ESBoolean(true);
    };

    override __subtype_of__ = (props: IFuncProps, n: Primitive): ESBoolean | Error => {
        if (Object.is(n, types.any) || Object.is(n, types.object)) {
            return new ESBoolean(true);
        }
        if (!(n instanceof ESObject)) {
            return new ESBoolean();
        }

        for (const key of Object.keys(this.__value__)) {
            if (!(key in n.__value__)) {
                return new ESBoolean();
            }
            const thisType = this.__value__[key];
            const nValue = n.__value__[key];

            const typeCheckRes = thisType.__subtype_of__(props, nValue);
            if (typeCheckRes instanceof Error) return typeCheckRes;
            if (!typeCheckRes.__value__) {
                return new ESBoolean();
            }
        }

        return new ESBoolean(true);
    };

    override __set__ = (props: IFuncProps, key: Primitive): void | Error => {
        return new TypeError('Mutable', 'Immutable', str(key));
    }

    override str = (depth = new ESNumber) => {
        let val = str(this.__value__, depth.__value__);
        // remove trailing new line
        if (val[val.length - 1] === '\n') {
            val = val.substr(0, val.length - 1);
        }
        return new ESString('interface ' + val);
    }
}