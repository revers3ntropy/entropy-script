import type { IFuncProps } from "../../util/util";
import type { ESNumber } from "./number";
import type { Error } from "../../errors";
import type { Primitive } from "../primitive";

export interface Iterable {
    len: (props: IFuncProps) => ESNumber | Error;
    __iter__: (props: IFuncProps) => Error | Primitive;
}