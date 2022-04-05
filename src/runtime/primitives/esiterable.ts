import type { funcProps } from "../../util/util";
import type { ESNumber } from "./esnumber";
import type { Error } from "../../errors";
import type { Primitive } from "../primitive";

export interface ESIterable {
    len: (props: funcProps) => ESNumber | Error;
    __iter__: (props: funcProps) => Error | Primitive;
}