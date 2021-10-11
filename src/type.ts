export class ESType {
    isPrimitive: boolean;
    name: string;
    value?: any;

    constructor (isPrimitive: boolean, name: string, value?: any) {
        this.isPrimitive = isPrimitive;
        this.name = name;
        this.value = value;
    }

    public includesType (t: ESType) {
        if (this.equals(ESType.any) || t.equals(ESType.any)) return true;
        return this.equals(t);
    }

    public equals (t: ESType) {
        return t.name === this.name && t.isPrimitive === this.isPrimitive && Object.is(this.value, t.value);
    }

    static undefined = new ESType(true, 'UndefinedType');
    static string = new ESType(true, 'String');
    static array = new ESType(true, 'Array');
    static number = new ESType(true, 'Number');
    static any = new ESType(true, 'Any');
    static function = new ESType(true, 'Function');
    static bool = new ESType(true, 'Boolean');
    static type = new ESType(true, 'Type');
}

// TODO: requires better solution
export class Undefined {}