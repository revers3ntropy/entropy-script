/**
 * @module entropy-script
 */
declare module 'entropy-script' {

    type BuiltInFunction = (config: funcProps, ...args: Primitive[]) => void | ESError | Primitive | Promise<void>;

    /**
     * The argument which has been populated with Primitive values
     */
    interface runtimeArgument {
        name: string;
        type: Primitive;
        defaultValue?: Primitive;
    }

    export class compileResult {
        val: string;
        error: ESError | undefined;

        constructor (val?: string | ESError);
    }

    const global: Context;
    const setGlobalContext: (c: Context) => void;
    const IS_NODE_INSTANCE: boolean;
    const runningInNode: () => void;
    const colours: { [k: string]: (s: string | undefined) => string };

    /**
     * The argument data before it has been interpreted
     */
    interface uninterpretedArgument {
        name: string;
        type: Node;
        defaultValue?: Node;
    }

    type enumDict<T extends number, U> = { [k in T]: U };
    type dict<T> = { [k in (string | number)]: T; };

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

        get (identifier: string): Primitive | ESError | undefined;

        getRawSymbolTableAsDict (): dict<Primitive>;

        getSymbolTableAsDict (): dict<ESSymbol>;

        getSymbol (identifier: string): undefined | ESSymbol | ESError;

        set (identifier: string, value: Primitive, options?: symbolOptions): void | ESError;

        setOwn (identifier: string, value: Primitive, options?: symbolOptions): void | ESError;

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
        static get unknown (): Position;
    }

    interface TracebackFrame {
        position: Position;
        line: string;
    }

    type symbolOptions = {
        isConstant?: boolean;
        isAccessible?: boolean;
        global?: boolean;
        forceThroughConst?: boolean;
    }

    class ESError {
        name: string;
        details: string;
        pos: Position;

        traceback: TracebackFrame[];

        constructor (pos: Position, name: string, details: string);

        get colouredStr (): string;

        get str (): string;
    }

    type NativeObj = any;

    type JSModuleParams = {
        [k: string]: NativeObj;
    };

    type funcProps = {
        context: Context
    };

    type typeName =
        'Undefined'
        | 'String'
        | 'Array'
        | 'Number'
        | 'Any'
        | 'Function'
        | 'Boolean'
        | 'Type'
        | 'Object'
        | string;

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
        error: ESError | undefined;
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

    function init (
        printFunc?: (...args: any[]) => void,
        inputFunc?: (msg: string, cb: (...arg: any[]) => any) => void,
        node?: boolean,
        libs?: JSModuleParams,
        context?: Context,
        path?: string,
    ): Promise<ESError | undefined>;

    function run (msg: string, args: {
        env: Context | undefined,
        measurePerformance: boolean | undefined,
        fileName: string | undefined,
        currentDir: string | undefined,
    }): interpretResult | ({ timeData: timeData } & interpretResult);

    function parse (code: string, props?: {
        fileName?: string,
        currentDir?: string
    }): {
        error?: ESError
        compileToJavaScript?: (outfile: string) => compileResult;
        interpret?: (env?: Context) => interpretResult;
    }

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
        info: Info;
        protected self: NativeObj;

        protected constructor (value: T, type?: ESType);

        str: () => ESString;
        cast: (props: funcProps, type: Primitive) => Primitive | ESError;

        __add__ (props: funcProps, n: Primitive): Primitive | ESError;

        __subtract__ (props: funcProps, n: Primitive): Primitive | ESError;

        __multiply__ (props: funcProps, n: Primitive): Primitive | ESError;

        __divide__ (props: funcProps, n: Primitive): Primitive | ESError;

        __pow__ (props: funcProps, n: Primitive): Primitive | ESError;

        __eq__ (props: funcProps, n: Primitive): ESBoolean | ESError;

        __gt__ (props: funcProps, n: Primitive): ESBoolean | ESError;

        __lt__ (props: funcProps, n: Primitive): ESBoolean | ESError;

        __and__ (props: funcProps, n: Primitive): ESBoolean | ESError;

        __or__ (props: funcProps, n: Primitive): ESBoolean | ESError;

        __bool__ (props: funcProps): ESBoolean | ESError;

        __setProperty__ (props: funcProps, key: Primitive, value: Primitive): void | ESError;

        __getProperty__: (props: funcProps, key: Primitive) => Primitive | ESError;

        __call__ (props: funcProps, ...parameters: Primitive[]): ESError | Primitive;

        bool (): ESBoolean;

        /**
         * Shallow clone of Primitive
         * @returns {Primitive} deep clone of this
         */
        clone: () => Primitive;

        /**
         * @returns if this type is a subset of the type passed
         */
        isa: (props: funcProps, type: Primitive) => ESBoolean | ESError;
        is: (props: funcProps, obj: Primitive) => ESBoolean;
        valueOf: () => T;
        typeName: () => string;
        hasProperty: (props: funcProps, key: Primitive) => ESBoolean;
        describe: (props: funcProps, info: Primitive) => void;
        detail: (props: funcProps, info: Primitive) => void;
    }

    class ESArray extends ESPrimitive <Primitive[]> {
        len: number;

        constructor (values?: Primitive[]);

        /**
         * Uses native Array.prototype.splice
         * @param val value to insert
         * @param idx index to insert at, defaults to end of array
         */
        add: (props: funcProps, val: Primitive, idx?: Primitive) => ESNumber;

        /**
         * Uses native Array.prototype.includes
         * @param val value to check for
         */
        contains: (props: funcProps, val: Primitive) => boolean;
    }

    class ESBoolean extends ESPrimitive <boolean> {
        constructor (val?: boolean);
    }

    class ESErrorPrimitive extends ESPrimitive <ESError> {
        constructor (error?: ESError);
    }

    class ESFunction extends ESPrimitive <Node | BuiltInFunction> {
        arguments_: runtimeArgument[];
        this_: ESObject;
        returnType: ESType;
        __closure__: Context;

        constructor (
            func?: Node | BuiltInFunction,
            arguments?: runtimeArgument[],
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

    class ESObject extends ESPrimitive <dict<Primitive>> {
        constructor (val?: dict<Primitive>);

        get keys (): ESString[];
        set keys (val: ESString[]);
    }

    class ESString extends ESPrimitive <string> {
        constructor (value?: string);
    }

    class ESType extends ESPrimitive<undefined> {
        readonly __isPrimitive__: boolean;
        readonly __name__: typeName;
        readonly __extends__: undefined | ESType;
        readonly __methods__: ESFunction[];
        readonly __init__: ESFunction | undefined;
        readonly __instances__: ESObject[];

        constructor (
            isPrimitive?: boolean,
            name?: typeName,
            __methods__?: ESFunction[],
            __extends__?: undefined | ESType,
            __init__?: undefined | ESFunction
        );

        includesType: (props: funcProps, t: ESType) => ESBoolean;
        equals: (props: funcProps, t: ESType) => ESBoolean;
    }

    class ESUndefined extends ESPrimitive <undefined> {
        constructor ();
    }

    class ESNamespace extends ESPrimitive<dict<ESSymbol>> {
        mutable: boolean;

        constructor (name: ESString, value: dict<ESSymbol>, mutable?: boolean);

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

        abstract interpret_ (context: Context): ESError | Primitive | interpretResult;

        interpret (context: Context): interpretResult;
    }

    class IllegalCharError extends ESError {
        constructor (pos: Position, char: string);
    }

    class ExpectedCharError extends ESError {
        constructor (pos: Position, char: string);
    }

    class TypeError extends ESError {
        constructor (pos: Position, expectedType: string, actualType: string, value: any, detail: string);
    }

    class ImportError extends ESError {
        constructor (pos: Position, url: string, detail: string);
    }

    class ReferenceError extends ESError {
        constructor (pos: Position, ref: string);
    }

    class IndexError extends ESError {
        constructor (pos: Position, ref: string, object: Primitive);
    }

    class InvalidOperationError extends ESError {
        constructor (op: string, value: Primitive, detail?: string, pos?: Position);
    }

    class InvalidRuntimeError extends ESError {
        constructor ();
    }

    class PermissionRequiredError extends ESError {
        constructor (detail: string);
    }

    function str(v: any): string;
    function wrap(thing: any, functionsTakeProps?: boolean): Primitive;
    function strip(thing: Primitive | undefined, props: funcProps): NativeObj;

    interface Permissions {
        networking: boolean;
        imports: boolean;
        accessDOM: boolean;
        useSTD: boolean;
    }

    const permissions: Permissions;

    function updatePermissions (newPermissions: Permissions): void;
}
