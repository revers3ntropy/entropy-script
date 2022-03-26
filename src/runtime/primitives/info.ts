export type Info = PrimitiveInfo & FunctionInfo & ObjectInfo;

export interface PrimitiveInfo {
    name?: string;
    description?: string;
    file?: string;
    helpLink?: string;
    builtin?: boolean;
}

export interface argInfo {
    name?: string;
    type?: string;
    description?: string;
    required?: boolean;
    default_value?: string;
}

export interface FunctionInfo extends PrimitiveInfo {
    args?: argInfo[];
    returns?: string;
    returnType?: string;
    allow_args?: boolean;
}

export interface ObjectInfo extends PrimitiveInfo {
    contents?: Info[];
}
