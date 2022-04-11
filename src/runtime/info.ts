export type Info = IPrimitiveInfo & IFunctionInfo & IObjectInfo;

export interface IPrimitiveInfo {
    name?: string;
    description?: string;
    file?: string;
    helpLink?: string;
    builtin?: boolean;
}

export interface IArgInfo {
    name?: string;
    type?: string;
    description?: string;
    required?: boolean;
    default_value?: string;
}

export interface IFunctionInfo extends IPrimitiveInfo {
    args?: IArgInfo[];
    returns?: string;
    returnType?: string;
    allow_args?: boolean;
    allow_kwargs?: boolean;
}

export interface IObjectInfo extends IPrimitiveInfo {
    contents?: Info[];
}
