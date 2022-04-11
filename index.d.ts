/**
 * @module entropy-script
 */
declare module 'entropy-script' {

    type BuiltInFunction = (config: IFuncProps, ...args: Primitive[]) => void | Error | Primitive | Promise<void>;

    /**
     * The argument which has been populated with Primitive values
     */
    interface IRuntimeArgument {
        name: string;
        type: Primitive;
        defaultValue?: Primitive;
    }

    export class CompileResult {
        val: string;
        error: Error | undefined;

        constructor (val?: string | Error);
    }

    const GLOBAL_CTX: Context;
    const setGlobalContext: (c: Context) => void;
    const IS_NODE_INSTANCE: boolean;
    const runningInNode: () => void;
    const colours: Map<(s?: string) => string>;

    /**
     * The argument data before it has been interpreted
     */
    interface IUninterpretedArgument {
        name: string;
        type: Node;
        defaultValue?: Node;
    }

    class Context {
        initialisedAsGlobal: boolean;
        deleted: boolean;
        path_: string;

        get path ();
        set path (val: string);

        get parent (): Context | undefined;
        set parent (val: Context | undefined);

        has (identifier: string): boolean;

        hasOwn (identifier: string): boolean;

        get (identifier: string): Primitive | Error | undefined;

        getRawSymbolTableAsDict (): Map<Primitive>;

        getSymbolTableAsDict (): Map<ESSymbol>;

        getSymbol (identifier: string): undefined | ESSymbol | Error;

        set (identifier: string, value: Primitive, options?: symbolOptions): void | Error;

        setOwn (identifier: string, value: Primitive, options?: symbolOptions): void | Error;

        remove (identifier: string): void;

        clear (): void;

        get root (): Context;

        get keys (): string[]

        resetAsGlobal (): void;

        clone (): Context;

        deepClone (): Context;

        log (): void;
    }


    class Position {
        file: string;
        idx: number;
        ln: number;
        col: number;

        constructor (idx: number, ln: number, col: number, file?: string);

        advance (currentChar: string): Position;

        get clone (): Position
        get str (): string;
        get isUnknown (): boolean;
        static get void (): Position;
    }

    interface TracebackFrame {
        position: Position;
        line: string;
    }

    export interface ICompileConfig {
        minify: boolean,
        indent: number,
        symbols: string[]
    }

    // global store of built-in types like 'String' and 'Type'
    export const types: Map<ESType>;

    // global object of all native dependencies like node-fetch and fs.
    export const libs: Map<NativeObj>;

    type symbolOptions = {
        isConstant?: boolean;
        isAccessible?: boolean;
        global?: boolean;
        forceThroughConst?: boolean;
    }

    class Error {
        name: string;
        details: string;
        pos: Position;

        traceback: TracebackFrame[];

        constructor (pos: Position, name: string, details: string);

        get colouredStr (): string;

        get str (): string;
    }

    type NativeObj = any;

    type JSModuleParams = Map<NativeObj>;

    export type EnumMap<T extends number, U> = {
        [k in T]: U
    };

    export type Map<T=any> = {
        [k in (string | number | symbol)]: T;
    };

    export interface IFuncProps {
        context: Context,
        kwargs?: Map<Primitive>
        dontTypeCheck?: boolean
    }

    type Primitive =
        ESPrimitive<NativeObj>
        | ESJSBinding
        | ESString
        | ESType
        | ESNumber
        | ESUndefined
        | ESBoolean
        | ESArray
        | ESObject
        | ESFunction
        | ESNamespace
        | ESErrorPrimitive;

    interface interpretResult {
        val: Primitive;
        error: Error | undefined;
        funcReturn: Primitive | undefined;
        shouldBreak: boolean;
        shouldContinue: boolean;
    }

    interface timeData {
        total: number,
        lexerTotal: number,
        parserTotal: number,
        interpretTotal: number,
        nodeMax: number,
        nodeAvg: number,
        nodeTotal: number,
        interprets: number,
    }

    class ESSymbol {
        isConstant: boolean;
        value: Primitive;
        identifier: string;
        isAccessible: boolean;

        constructor (value: Primitive, identifier: string, options?: symbolOptions);

        clone: () => ESSymbol;
        str: () => string;
    }

    function init (props?: {
       print: (...args: any[]) => void,
       input?: (msg: string, cb: (...arg: any[]) => any) => void,
       node?: boolean,
       libs?: JSModuleParams,
       context?: Context,
       path?: string,
    }): Promise<Error | undefined>;

    function run (code: string, args: {
        env: Context | undefined,
        measurePerformance: boolean | undefined,
        fileName: string | undefined,
        currentDir: string | undefined,
    }): interpretResult | ({ timeData: timeData } & interpretResult);

    function parse (code: string, props?: {
        fileName?: string,
        currentDir?: string
    }): {
        error?: Error
        compileToJavaScript?: (outfile: string) => CompileResult;
        interpret?: (env?: Context) => interpretResult;
    };

    type Info = PrimitiveInfo & FunctionInfo & ObjectInfo;

    interface PrimitiveInfo {
        name?: string;
        description?: string;
        file?: string;
        helpLink?: string;
        isBuiltIn?: boolean;
    }

    interface argInfo {
        name?: string;
        type?: string;
        description?: string;
        required?: boolean;
        defaultValue?: string;
    }

    interface FunctionInfo extends PrimitiveInfo {
        args?: argInfo[];
        returns?: string;
        returnType?: string;
    }

    interface ObjectInfo extends PrimitiveInfo {
        contents?: Info[];
    }

    abstract class ESPrimitive<T> {
        __value__: T;
        __type__: ESType;
        __info__: Info;
        protected _: NativeObj;

        protected constructor (value: T, type?: ESType);

        str: () => ESString;
        cast: (props: IFuncProps, type: Primitive) => Primitive | Error;

        __add__ (props: IFuncProps, n: Primitive): Primitive | Error;

        __subtract__ (props: IFuncProps, n: Primitive): Primitive | Error;

        __multiply__ (props: IFuncProps, n: Primitive): Primitive | Error;

        __divide__ (props: IFuncProps, n: Primitive): Primitive | Error;

        __pow__ (props: IFuncProps, n: Primitive): Primitive | Error;

        __eq__ (props: IFuncProps, n: Primitive): ESBoolean | Error;

        __gt__ (props: IFuncProps, n: Primitive): ESBoolean | Error;

        __lt__ (props: IFuncProps, n: Primitive): ESBoolean | Error;

        __and__ (props: IFuncProps, n: Primitive): ESBoolean | Error;

        __or__ (props: IFuncProps, n: Primitive): ESBoolean | Error;

        __bool__ (props: IFuncProps): ESBoolean | Error;

        __set__ (props: IFuncProps, key: Primitive, value: Primitive): void | Error;

        __get__: (props: IFuncProps, key: Primitive) => Primitive | Error;

        __call__ (props: IFuncProps, ...parameters: Primitive[]): Error | Primitive;

        __iter__ (props: IFuncProps): Error | Primitive;

        __next__ (props: IFuncProps): Error | Primitive;

        bool (): ESBoolean;

        /**
         * Shallow clone of Primitive
         * @returns {Primitive} deep clone of this
         */
        clone: () => Primitive;

        /**
         * @returns if this type is a subset of the type passed
         */
        isa: (props: IFuncProps, type: Primitive) => ESBoolean | Error;
        is: (props: IFuncProps, obj: Primitive) => ESBoolean;
        valueOf: () => T;
        typeName: () => string;
        hasProperty: (props: IFuncProps, key: Primitive) => ESBoolean;
        describe: (props: IFuncProps, info: Primitive) => void;
        detail: (props: IFuncProps, info: Primitive) => void;
    }

    class ESArray extends ESPrimitive <Primitive[]> {
        len: number;

        constructor (values?: Primitive[]);

        /**
         * Uses native Array.prototype.splice
         * @param val value to insert
         * @param idx index to insert at, defaults to end of array
         */
        add: (props: IFuncProps, val: Primitive, idx?: Primitive) => ESNumber;

        /**
         * Uses native Array.prototype.includes
         * @param val value to check for
         */
        contains: (props: IFuncProps, val: Primitive) => boolean;
    }

    class ESBoolean extends ESPrimitive <boolean> {
        constructor (val?: boolean);
    }

    class ESErrorPrimitive extends ESPrimitive <Error> {
        constructor (error?: Error);
    }

    class ESFunction extends ESPrimitive <Node | BuiltInFunction> {
        __args__: IRuntimeArgument[];
        __kwargs__: Map<IRuntimeArgument>;
        __this__: ESObject;
        returnType: ESType;
        __closure__: Context;

        constructor (
            func?: Node | BuiltInFunction,
            arguments?: IRuntimeArgument[],
            name?: string,
            this_?: ESObject,
            returnType?: ESType,
            closure?: Context
        );

        get name (): string;
        set name (v: string);
    }

    class ESJSBinding<T = NativeObj> extends ESPrimitive<T> {
        constructor (value: T, name?: string, functionsTakeProps?: boolean);
    }

    class ESNumber extends ESPrimitive <number> {
        constructor (value?: number);
    }

    class ESObject extends ESPrimitive <Map<Primitive>> {
        constructor (val?: Map<Primitive>);

        get keys (): ESString[];
        set keys (val: ESString[]);
    }

    class ESString extends ESPrimitive <string> {
        constructor (value?: string);
    }

    class ESType extends ESPrimitive<undefined> {
        readonly __isPrimitive__: boolean;
        readonly __name__: string;
        readonly __extends__: undefined | ESType;
        readonly __methods__: ESFunction[];
        readonly __init__: ESFunction | undefined;
        readonly __instances__: ESObject[];

        constructor (
            isPrimitive?: boolean,
            name?: string,
            __methods__?: ESFunction[],
            __extends__?: undefined | ESType,
            __init__?: undefined | ESFunction
        );

        includesType: (props: IFuncProps, t: ESType) => ESBoolean;
        equals: (props: IFuncProps, t: ESType) => ESBoolean;
    }

    class ESUndefined extends ESPrimitive <undefined> {
        constructor ();
    }

    class ESNamespace extends ESPrimitive<Map<ESSymbol>> {
        mutable: boolean;

        constructor (name: ESString, value: Map<ESSymbol>, mutable?: boolean);

        get name (): ESString;
        set name (v: ESString);
    }

    abstract class Node {
        pos: Position;
        isTerminal: boolean;

        static interprets: number;
        static totalTime: number;
        static maxTime: number;

        protected constructor (pos: Position, isTerminal?: boolean);

        abstract interpret_ (context: Context): Error | Primitive | interpretResult;

        interpret (context: Context): interpretResult;
    }

    class IllegalCharError extends Error {
        constructor (pos: Position, char: string);
    }

    class ExpectedCharError extends Error {
        constructor (pos: Position, char: string);
    }

    class TypeError extends Error {
        constructor (pos: Position, expectedType: string, actualType: string, value: any, detail: string);
    }

    class ImportError extends Error {
        constructor (pos: Position, url: string, detail: string);
    }

    class ReferenceError extends Error {
        constructor (pos: Position, ref: string);
    }

    class IndexError extends Error {
        constructor (pos: Position, ref: string, object: Primitive);
    }

    class InvalidOperationError extends Error {
        constructor (op: string, value: Primitive, detail?: string, pos?: Position);
    }

    class InvalidRuntimeError extends Error {
        constructor ();
    }

    class PermissionRequiredError extends Error {
        constructor (detail: string);
    }

    function str(v: any): string;
    function wrap(thing: any, functionsTakeProps?: boolean): Primitive;
    function strip(thing: Primitive | undefined, props: IFuncProps): NativeObj;

    interface Permissions {
        networking: boolean;
        imports: boolean;
        accessDOM: boolean;
        useSTD: boolean;
    }

    const permissions: Permissions;

    function updatePermissions (newPermissions: Permissions): void;

    function parseConfig (configJSON: Map): void;

    const config: {
        permissions: {
            networking: boolean;
            imports: boolean;
            accessDOM: boolean;
            useSTD: boolean;
            fileSystem: boolean,
        } & Map
    };

    const configFileName: string;

    const VERSION: string;
}
