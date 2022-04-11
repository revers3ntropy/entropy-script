import { Primitive } from "../primitive";
import { IFuncProps, str } from "../../util/util";
import { Error, InvalidOperationError } from "../../errors";
import { ESBoolean } from "./boolean";
import { types } from "../../util/constants";
import { ESType, ESTypeUnion } from "./type";
import { ESTypeIntersection } from "./intersection";

export class ESTypeNot extends ESType {
    private readonly __val__: Primitive;

    constructor (type: Primitive) {
        super(false, `~(${ str(type) })`);
        this.__val__ = type;
    }

    override __call__ = (): Error | Primitive => {
        return new InvalidOperationError('__call__', this);
    }

    override __includes__ = (props: IFuncProps, t: Primitive): ESBoolean | Error => {
        const res = this.__val__.__includes__(props, t);
        if (res instanceof Error) return res;

        return new ESBoolean(!res.__value__);
    }

    override __subtype_of__ = (props: IFuncProps, t: Primitive): ESBoolean | Error => {
        if (Object.is(t, types.any)) {
            return new ESBoolean(true);
        }

        /*
            weird case caught here:
            (~Str).__subtype_of__(Str | Num)
            should be false as it could be a string
        */
        if (t instanceof ESTypeUnion || t instanceof ESTypeIntersection) {
            const leftRes = t.__left__.__subtype_of__(props, this.__val__);
            if (leftRes instanceof Error) return leftRes;
            if (leftRes.__value__) return new ESBoolean();

            const rightRes = t.__right__.__subtype_of__(props, this.__val__);
            if (rightRes instanceof Error) return rightRes;
            if (rightRes.__value__) return new ESBoolean();
            return new ESBoolean(true);
        }

        const res = this.__val__.__subtype_of__(props, t);
        if (res instanceof Error) return res;

        return new ESBoolean(!res.__value__);
    }

    override clone = () => {
        return new ESTypeNot(this.__val__);
    }

    override __eq__ = (props: IFuncProps, t: Primitive) => {
        if (!(t instanceof ESTypeNot)) {
            return new ESBoolean();
        }

        const typeCheckRes = this.__val__.__eq__(props, t.__val__);
        if (typeCheckRes instanceof Error) {
            return typeCheckRes;
        }
        return new ESBoolean(typeCheckRes.__value__ === true);
    }

    override __generic__ (): Error | Primitive {
        return new InvalidOperationError('__generic__', this);
    }
}