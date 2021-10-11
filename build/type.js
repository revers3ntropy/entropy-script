export class ESType {
    constructor(isPrimitive, name, value) {
        this.isPrimitive = isPrimitive;
        this.name = name;
        this.value = value;
    }
    includesType(t) {
        if (this.equals(ESType.any) || t.equals(ESType.any))
            return true;
        return this.equals(t);
    }
    equals(t) {
        return t.name === this.name && t.isPrimitive === this.isPrimitive && Object.is(this.value, t.value);
    }
}
ESType.undefined = new ESType(true, 'UndefinedType');
ESType.string = new ESType(true, 'String');
ESType.array = new ESType(true, 'Array');
ESType.number = new ESType(true, 'Number');
ESType.any = new ESType(true, 'Any');
ESType.function = new ESType(true, 'Function');
ESType.bool = new ESType(true, 'Boolean');
ESType.type = new ESType(true, 'Type');
// TODO: requires better solution
export class Undefined {
}
