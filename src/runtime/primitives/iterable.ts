import type { IFuncProps, Primitive } from "../../util/util";
import type { ESNumber } from "./number";
import type { Error } from "../../errors";
import type { ESBoolean } from "./boolean";

export interface Iterable {
    len: (props: IFuncProps) => ESNumber | Error;
    __iter__: (props: IFuncProps) => Error | Primitive;

    // proposed methods
    map?: (props: IFuncProps) => (Iterable & Primitive) | Error;
    filter?: (props: IFuncProps) => (Iterable & Primitive) | Error;
    find?: (props: IFuncProps) => Primitive | Error;
    indexof?: (props: IFuncProps) => ESNumber | Error;
    at?: (props: IFuncProps) => Primitive | Error;
    for?: (props: IFuncProps) => (Iterable & Primitive) | Error;
    contains?: (props: IFuncProps, val: Primitive) => ESBoolean | Error;
    pop?: (props: IFuncProps) => Primitive | Error;
    reduce?: (props: IFuncProps) => Primitive | Error;
    reverse?: (props: IFuncProps) => (Iterable & Primitive) | Error;
    splice?: (props: IFuncProps) => (Iterable & Primitive) | Error;
    insert?: (props: IFuncProps) => (Iterable & Primitive) | Error;
    shift?: (props: IFuncProps) => (Iterable & Primitive) | Error;
    unshift?: (props: IFuncProps) => (Iterable & Primitive) | Error;
}