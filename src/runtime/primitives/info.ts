export type Info = PrimitiveInfo & FunctionInfo & ObjectInfo;

export interface PrimitiveInfo {
    name?: string;
    description?: string;
    file?: string;
    helpLink?: string;
    isBuiltIn?: boolean;
}

export interface argInfo {
    name?: string;
    type?: string;
    description?: string;
    required?: boolean;
    defaultValue?: string;
}

export interface FunctionInfo extends PrimitiveInfo {
    args?: argInfo[];
    returns?: string;
    returnType?: string;
}

export interface ObjectInfo extends PrimitiveInfo {
    contents?: Info[];
}
