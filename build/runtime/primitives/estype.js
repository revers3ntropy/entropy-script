import { createInstance } from '../instantiator.js';
import { ESBoolean } from './esboolean.js';
import { ESString } from './esstring.js';
import { ESPrimitive } from './esprimitive.js';
import { types } from './primitive.js';
export class ESType extends ESPrimitive {
    constructor(isPrimitive = false, name = '(anon)', __methods__ = [], __extends__, __init__) {
        super(undefined, types === null || types === void 0 ? void 0 : types.type);
        this.__instances__ = [];
        this.clone = (chain) => {
            var _a;
            return new ESType(this.__isPrimitive__, this.__name__, this.__methods__.map(f => f.clone(chain)), this.__extends__, (_a = this.__init__) === null || _a === void 0 ? void 0 : _a.clone(chain));
        };
        this.isa = ({}, type) => {
            return new ESBoolean(type === types.type);
        };
        this.cast = ({}, type) => this;
        this.includesType = ({ context }, t) => {
            var _a, _b, _c, _d, _e, _f;
            if (this.equals({ context }, types.any).bool().valueOf() ||
                t.equals({ context }, types.any).bool().valueOf() ||
                (((_a = this.__extends__) === null || _a === void 0 ? void 0 : _a.equals({ context }, t).valueOf()) === true) ||
                (((_b = this.__extends__) === null || _b === void 0 ? void 0 : _b.equals({ context }, types.any).valueOf()) === true) ||
                (((_c = this.__extends__) === null || _c === void 0 ? void 0 : _c.includesType({ context }, t).valueOf()) === true) ||
                (((_d = t.__extends__) === null || _d === void 0 ? void 0 : _d.equals({ context }, this).valueOf()) === true) ||
                (((_e = t.__extends__) === null || _e === void 0 ? void 0 : _e.equals({ context }, types.any).valueOf()) === true) ||
                (((_f = t.__extends__) === null || _f === void 0 ? void 0 : _f.includesType({ context }, this).valueOf()) === true)) {
                return new ESBoolean(true);
            }
            return this.equals({ context }, t);
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
