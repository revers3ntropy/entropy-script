import { Primitive } from "../primitive";
import { IFuncProps, str } from "../../util/util";
import { Error, InvalidOperationError } from "../../errors";
import { ESBoolean } from "./boolean";
import { types } from "../../util/constants";
import { ESType } from "./type";

export class ESTypeIntersection extends ESType {

    readonly __left__: Primitive;
    readonly __right__: Primitive;

    constructor (left: Primitive, right: Primitive) {
        super(false, `(${ str(left) }) & (${ str(right) })`);
        this.__left__ = left;
        this.__right__ = right;
    }

    override __call__ = (): Error | Primitive => {
        return new InvalidOperationError('__call__', this);
    }

    override __includes__ = (props: IFuncProps, t: Primitive): ESBoolean | Error => {
        const leftRes = this.__left__.__includes__(props, t);
        const rightRes = this.__right__.__includes__(props, t);
        if (leftRes instanceof Error) return leftRes;
        if (rightRes instanceof Error) return rightRes;

        return new ESBoolean(
            leftRes.__value__ &&
            rightRes.__value__
        );
    }

    override __subtype_of__ = (props: IFuncProps, t: Primitive): ESBoolean | Error => {
        if (t === types.any) {
            return new ESBoolean(true);
        }

        const eqCheckRes = this.__eq__(props, t);
        if (eqCheckRes instanceof Error) {
            return eqCheckRes;
        }
        if (eqCheckRes.__value__) {
            return new ESBoolean(true);
        }

        const leftRes = this.__left__.__subtype_of__(props, t);
        const rightRes = this.__right__.__subtype_of__(props, t);
        if (leftRes instanceof Error) return leftRes;
        if (rightRes instanceof Error) return rightRes;

        return new ESBoolean(
            leftRes.__value__ ||
            rightRes.__value__
        );
    }

    override clone = () => {
        return new ESTypeIntersection(this.__left__, this.__right__);
    }

    override __eq__ = (props: IFuncProps, t: Primitive) => {
        if (!(t instanceof ESTypeIntersection)) return new ESBoolean();

        const leftTypeCheckRes = this.__left__.__eq__(props, t.__left__);
        if (leftTypeCheckRes instanceof Error) return leftTypeCheckRes;

        const rightTypeCheckRes = this.__right__.__eq__(props, t.__right__);
        if (rightTypeCheckRes instanceof Error) return rightTypeCheckRes;

        return new ESBoolean(leftTypeCheckRes.__value__ && rightTypeCheckRes.__value__);
    }

    override __generic__ (): Error | Primitive {
        return new InvalidOperationError('__generic__', this);
    }
}