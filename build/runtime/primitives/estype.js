import { IndexError, InvalidOperationError } from '../../errors.js';
import { createInstance } from '../instantiator.js';
import { ESBoolean } from './esboolean.js';
import { ESFunction } from './esfunction.js';
import { ESString } from './esstring.js';
import { ESPrimitive } from './esprimitive.js';
import { types } from './primitive.js';
import { wrap } from "./wrapStrip.js";
import { Position } from "../../position.js";
import { str } from "../../util/util.js";
export class ESType extends ESPrimitive {
    constructor(isPrimitive = false, name = '(anon)', __methods__ = [], __extends__, __init__) {
        super(undefined, types === null || types === void 0 ? void 0 : types.type);
        this.__instances__ = [];
        this.clone = () => {
            return new ESType(this.__isPrimitive__, this.__name__, this.__methods__, this.__extends__, this.__init__);
        };
        this.isa = ({}, type) => {
            return new ESBoolean(type === types.type);
        };
        this.cast = ({}, type) => new InvalidOperationError('cast', this);
        this.includesType = (props, t) => {
            var _a, _b, _c, _d, _e, _f;
            if (this.equals(props, types.any).bool().valueOf() ||
                t.equals(props, types.any).bool().valueOf() ||
                (((_a = this.__extends__) === null || _a === void 0 ? void 0 : _a.equals(props, t).valueOf()) === true) ||
                (((_b = this.__extends__) === null || _b === void 0 ? void 0 : _b.equals(props, types.any).valueOf()) === true) ||
                (((_c = this.__extends__) === null || _c === void 0 ? void 0 : _c.includesType(props, t).valueOf()) === true) ||
                (((_d = t.__extends__) === null || _d === void 0 ? void 0 : _d.equals(props, this).valueOf()) === true) ||
                (((_e = t.__extends__) === null || _e === void 0 ? void 0 : _e.equals(props, types.any).valueOf()) === true) ||
                (((_f = t.__extends__) === null || _f === void 0 ? void 0 : _f.includesType(props, this).valueOf()) === true)) {
                return new ESBoolean(true);
            }
            return this.equals(props, t);
        };
        this.equals = ({}, t) => {
            return new ESBoolean(t.__name__ === this.__name__ &&
                t.__isPrimitive__ === this.__isPrimitive__ &&
                Object.is(this.valueOf(), t.valueOf()));
        };
        this.__call__ = ({ context }, ...params) => {
            return createInstance(this, { context }, params || []);
        };
        this.str = () => new ESString(`<Type: ${this.__name__}>`);
        this.__bool__ = () => new ESBoolean(true);
        this.bool = this.__bool__;
        this.__getProperty__ = ({}, key) => {
            if (this.self.hasOwnProperty(str(key))) {
                const val = this.self[str(key)];
                if (typeof val === 'function') {
                    return new ESFunction(val);
                }
                return wrap(val);
            }
            return new IndexError(Position.unknown, key.valueOf(), this);
        };
        this.__isPrimitive__ = isPrimitive;
        this.__name__ = name;
        this.info.name = name;
        this.__extends__ = __extends__;
        this.__methods__ = __methods__;
        if (__init__) {
            __init__.name = name;
            this.__init__ = __init__;
        }
        if (!types.type) {
            this.__type__ = this;
        }
    }
}
