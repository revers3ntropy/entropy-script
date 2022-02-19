import { global } from '../../constants.js';
import { ESError } from '../../errors.js';
import { Position } from '../../position.js';
import { call } from '../functionCaller.js';
import { ESPrimitive } from './esprimitive.js';
import { str } from '../../util/util.js';
import { ESBoolean } from './esboolean.js';
import { ESObject } from './esobject.js';
import { ESString } from './esstring.js';
import { types } from './primitive.js';
export class ESFunction extends ESPrimitive {
    constructor(func = (() => { }), arguments_ = [], name = '(anonymous)', this_ = new ESObject(), returnType = types.any, closure = global) {
        super(func, types.function);
        this.isa = ({}, type) => {
            return new ESBoolean(type === types.function);
        };
        this.cast = ({}, type) => {
            return new ESError(Position.unknown, 'TypeError', `Cannot cast type 'function'`);
        };
        this.clone = (chain) => {
            return new ESFunction(this.__value__, this.arguments_, this.name, this.this_, this.returnType, this.__closure__);
        };
        this.valueOf = () => this;
        this.str = () => new ESString(`<Func: ${this.name}>`);
        this.__eq__ = ({}, n) => {
            if (!(n instanceof ESFunction))
                return new ESBoolean(false);
            return new ESBoolean(this.__value__ === n.__value__);
        };
        this.__bool__ = () => new ESBoolean(true);
        this.bool = this.__bool__;
        this.__call__ = ({}, ...params) => {
            return call(this.__closure__, this, params);
        };
        this.arguments_ = arguments_;
        this.info.name = name;
        this.this_ = this_;
        this.returnType = returnType;
        this.__closure__ = closure;
        this.info.returnType = str(returnType);
        this.info.args = arguments_.map(arg => ({
            name: arg.name,
            defaultValue: str(arg.defaultValue),
            type: arg.type.info.name,
            required: true
        }));
    }
    get name() {
        var _a;
        return (_a = this.info.name) !== null && _a !== void 0 ? _a : '(anonymous)';
    }
    set name(v) {
        this.info.name = v;
    }
}
