import{tokenTypeString,tt}from"../parse/tokens.js";import{ESError,InvalidSyntaxError,ReferenceError,TypeError}from"../errors.js";import{Context}from"./context.js";import{Position}from"../position.js";import{None,now}from"../constants.js";import{interpretArgument}from"./argument.js";import{ESArray,ESBoolean,ESFunction,ESNamespace,ESNumber,ESObject,ESPrimitive,ESString,ESType,ESUndefined,types}from"./primitiveTypes.js";import{str}from"../util/util.js";export class interpretResult{constructor(){this.val=new ESUndefined,this.shouldBreak=!1,this.shouldContinue=!1}}export class Node{constructor(e,t=!1){this.startPos=e,this.isTerminal=t}interpret(e){var t;const r=now(),n=new interpretResult,s=this.interpret_(e);s instanceof ESError?n.error=s:s instanceof interpretResult?(n.val=s.val,n.error=s.error,n.funcReturn=s.funcReturn,n.shouldBreak=s.shouldBreak,n.shouldContinue=s.shouldContinue):n.val=s,n.error&&n.error.startPos.isUnknown&&(n.error.startPos=this.startPos),(t=n.val.info).file||(t.file=this.startPos.file),Node.interprets++;let i=now()-r;return Node.totalTime+=i,i>Node.maxTime&&(Node.maxTime=i),n}}Node.interprets=0,Node.totalTime=0,Node.maxTime=0;export class N_binOp extends Node{constructor(e,t,r,n){super(e),this.left=t,this.opTok=r,this.right=n}interpret_(e){const t=this.left.interpret(e);if(t.error)return t.error;const r=this.right.interpret(e);if(r.error)return r.error;const n=t.val,s=r.val;if(void 0===n)return new TypeError(this.opTok.startPos,"~undefined","undefined",n,"N_binOp.interpret_");if(void 0===s)return new TypeError(this.opTok.startPos,"~undefined","undefined",s,"N_binOp.interpret_");function i(e,t,r,n){return e instanceof ESPrimitive&&t instanceof ESPrimitive&&e.hasProperty(new ESString(r))?e[r](t):new TypeError(n,"unknown",null==e?void 0:e.typeOf().valueOf(),null==e?void 0:e.valueOf(),`Unsupported operand for ${r}`)}switch(this.opTok.type){case tt.LTE:{const e=i(n,s,"__lt__",this.opTok.startPos),t=i(n,s,"__eq__",this.opTok.startPos);return e instanceof ESError?e:t instanceof ESError?t:i(e,t,"__or__",this.opTok.startPos)}case tt.GTE:{const e=i(n,s,"__gt__",this.opTok.startPos),t=i(n,s,"__eq__",this.opTok.startPos);return e instanceof ESError?e:t instanceof ESError?t:i(e,t,"__or__",this.opTok.startPos)}case tt.NOTEQUALS:{const e=i(n,s,"__eq__",this.opTok.startPos);return e instanceof ESError?e:new ESBoolean(!e.bool().valueOf())}case tt.ADD:return i(n,s,"__add__",this.opTok.startPos);case tt.SUB:return i(n,s,"__subtract__",this.opTok.startPos);case tt.MUL:return i(n,s,"__multiply__",this.opTok.startPos);case tt.DIV:return i(n,s,"__divide__",this.opTok.startPos);case tt.POW:return i(n,s,"__pow__",this.opTok.startPos);case tt.EQUALS:return i(n,s,"__eq__",this.opTok.startPos);case tt.LT:return i(n,s,"__lt__",this.opTok.startPos);case tt.GT:return i(n,s,"__gt__",this.opTok.startPos);case tt.AND:return i(n,s,"__and__",this.opTok.startPos);case tt.OR:return i(n,s,"__or__",this.opTok.startPos);default:return new InvalidSyntaxError(this.opTok.startPos,`Invalid binary operator: ${tokenTypeString[this.opTok.type]}`)}}}export class N_unaryOp extends Node{constructor(e,t,r){super(e),this.a=t,this.opTok=r}interpret_(e){var t,r,n;const s=this.a.interpret(e);if(s.error)return s.error;switch(this.opTok.type){case tt.SUB:case tt.ADD:if(!(s.val instanceof ESNumber))return new TypeError(this.startPos,"Number",(null===(t=s.val)||void 0===t?void 0:t.typeOf().toString())||"undefined_",null===(r=s.val)||void 0===r?void 0:r.valueOf());const e=s.val.valueOf();return new ESNumber(this.opTok.type===tt.SUB?-e:Math.abs(e));case tt.NOT:return new ESBoolean(!(null===(n=null==s?void 0:s.val)||void 0===n?void 0:n.bool().valueOf()));default:return new InvalidSyntaxError(this.opTok.startPos,`Invalid unary operator: ${tokenTypeString[this.opTok.type]}`)}}}export class N_varAssign extends Node{constructor(e,t,r,n="=",s=!1,i=!1,o=!1,a=!1,l=types.any){super(e),this.value=r,this.varNameTok=t,this.isGlobal=s,this.assignType=n,this.isConstant=o,this.isDeclaration=a,this.isLocal=i,this.type=l instanceof ESType?new N_any(l):l}interpret_(e){var t,r,n,s,i,o,a;if(this.isDeclaration&&e.hasOwn(this.varNameTok.value))return new InvalidSyntaxError(this.startPos,`Symbol '${this.varNameTok.value}' already exists, and cannot be redeclared`);const l=this.value.interpret(e),u=this.type.interpret(e);if(l.error)return l.error;if(u.error)return u.error;if(!(u.val&&u.val instanceof ESType))return new TypeError(this.varNameTok.startPos,"Type",null!==(r=null===(t=u.val)||void 0===t?void 0:t.typeOf().valueOf())&&void 0!==r?r:"undefined",null===(n=u.val)||void 0===n?void 0:n.str(),"@ !typeRes.val || !(typeRes.val instanceof ESType)");if(!l.val)return new TypeError(this.varNameTok.startPos,"~undefined","undefined","N_varAssign.interpret_");if(!u.val.includesType(l.val.__type__))return new TypeError(this.varNameTok.startPos,null!==(s=u.val.str().valueOf())&&void 0!==s?s:"unknown type",null!==(o=null===(i=l.val)||void 0===i?void 0:i.typeOf().valueOf())&&void 0!==o?o:"undefined__",null===(a=l.val)||void 0===a?void 0:a.str());if(this.isDeclaration)return"="!==this.assignType?new InvalidSyntaxError(this.startPos,`Cannot declare variable with operator '${this.assignType}'`):(e.setOwn(this.varNameTok.value,l.val,{global:!1,isConstant:this.isConstant}),l.val);if("="===this.assignType){let t=l.val;void 0===t&&(t=new ESUndefined);const r=e.set(this.varNameTok.value,t,{global:this.isGlobal,isConstant:this.isConstant});if(r instanceof ESError)return r}else{if(this.isDeclaration)return new InvalidSyntaxError(this.startPos,`Cannot declare variable with operator '${this.assignType}'`);const t=e.get(this.varNameTok.value);if(t instanceof ESError)return t;if(null==t)return new InvalidSyntaxError(this.startPos,`Cannot declare variable with operator '${this.assignType}'`);let r,n=l.val;switch(this.assignType[0]){case"*":if(!(null==t?void 0:t.__multiply__))return new TypeError(this.startPos,"unknown",t.typeOf().valueOf(),null==t?void 0:t.valueOf(),"Unsupported operand for '*'");r=t.__multiply__(n);break;case"/":if(!(null==t?void 0:t.__divide__))return new TypeError(this.startPos,"unknown",t.typeOf().valueOf(),null==t?void 0:t.valueOf(),"Unsupported operand for '/'");r=t.__divide__(n);break;case"+":if(!(null==t?void 0:t.__add__))return new TypeError(this.startPos,"unknown",t.typeOf().valueOf(),null==t?void 0:t.valueOf(),"Unsupported operand for '+'");r=t.__add__(n);break;case"-":if(!(null==t?void 0:t.__subtract__))return new TypeError(this.startPos,"unknown",t.typeOf().valueOf(),null==t?void 0:t.valueOf(),"Unsupported operand for '-'");r=t.__subtract__(n);break;default:return new ESError(this.startPos,"AssignError",`Cannot find assignType of ${this.assignType[0]}`)}if(r instanceof ESError)return r;let s=e.set(this.varNameTok.value,r,{global:this.isGlobal,isConstant:this.isConstant});if(s instanceof ESError)return s;l.val=r}return"(anonymous)"!==l.val.info.name&&l.val.info.name||(l.val.info.name=this.varNameTok.value),l}}export class N_if extends Node{constructor(e,t,r,n){super(e),this.comparison=t,this.ifFalse=n,this.ifTrue=r}interpret_(e){var t;let r=new Context;r.parent=e;let n=new interpretResult,s=this.comparison.interpret(e);if(s.error)return s;if(null===(t=s.val)||void 0===t?void 0:t.bool().valueOf()){if(n=this.ifTrue.interpret(r),n.val=new ESUndefined,n.error)return n}else if(this.ifFalse&&(n=this.ifFalse.interpret(r),n.val=new ESUndefined,n.error))return n;return n}}export class N_while extends Node{constructor(e,t,r){super(e),this.comparison=t,this.loop=r}interpret_(e){var t,r;let n=new Context;for(n.parent=e;;){let s=this.comparison.interpret(e);if(s.error)return s;if(!(null===(r=null===(t=s.val)||void 0===t?void 0:t.bool())||void 0===r?void 0:r.valueOf()))break;let i=this.loop.interpret(n);if(i.error)return i;if(i.shouldBreak)break}return new ESUndefined}}export class N_for extends Node{constructor(e,t,r,n,s,i){super(e),this.body=t,this.array=r,this.identifier=n,this.isGlobalId=s,this.isConstId=i}interpret_(e){var t,r,n,s,i,o,a,l;let u=new Context;u.parent=e;let p=None;const d=this.array.interpret(e);if(d.error)return d;if(-1===["Array","Number","Object","String","Any"].indexOf((null===(t=d.val)||void 0===t?void 0:t.typeOf().valueOf())||""))return new TypeError(this.identifier.startPos,"Array | Number | Object | String",typeof d.val+" | "+(null===(r=d.val)||void 0===r?void 0:r.typeOf()));function f(e,t,r,n,s){return u.set(t,r,{global:n,isConstant:s}),p=e.interpret(u),p.error||void 0!==p.funcReturn?p:p.shouldBreak?(p.shouldBreak=!1,"break"):void(p.shouldContinue&&(p.shouldContinue=!1))}if(d.val instanceof ESNumber||"number"==typeof(null===(n=d.val)||void 0===n?void 0:n.valueOf()))for(let e=0;e<d.val.valueOf();e++){const t=f(this.body,this.identifier.value,new ESNumber(e),this.isGlobalId,this.isConstId);if("break"===t)break;if(t&&(t.error||void 0!==t.funcReturn))return t}else if(d.val instanceof ESObject||"number"==typeof(null===(s=d.val)||void 0===s?void 0:s.valueOf())&&!Array.isArray(null===(i=d.val)||void 0===i?void 0:i.valueOf()))for(let e in null===(o=d.val)||void 0===o?void 0:o.valueOf()){const t=f(this.body,this.identifier.value,new ESString(e),this.isGlobalId,this.isConstId);if("break"===t)break;if(t&&(t.error||void 0!==t.funcReturn))return t}else{if(!(d.val instanceof ESArray||Array.isArray(null===(a=d.val)||void 0===a?void 0:a.valueOf())))return new TypeError(this.identifier.startPos,"Array | Number | Object | String",typeof d.val);for(let e of null===(l=d.val)||void 0===l?void 0:l.valueOf()){const t=f(this.body,this.identifier.value,e,this.isGlobalId,this.isConstId);if("break"===t)break;if(t&&(t.error||void 0!==t.funcReturn))return t}}return new ESUndefined}}export class N_array extends Node{constructor(e,t,r=!1){super(e),this.items=t,this.shouldClone=r}interpret_(e){let t=new interpretResult,r=[];for(let t of this.items){const n=t.interpret(e);if(n.error||void 0!==n.funcReturn)return n;if(!n.val)continue;let s=n.val;this.shouldClone&&(s=s.clone()),r.push(s)}return t.val=new ESArray(r),t}}export class N_objectLiteral extends Node{constructor(e,t){super(e),this.properties=t}interpret_(e){let t={};for(const[r,n]of this.properties){const s=n.interpret(e);if(s.error)return s.error;const i=r.interpret(e);if(i.error)return i.error;i.val&&s.val&&(t[i.val.valueOf()]=s.val)}return new ESObject(t)}}export class N_emptyObject extends Node{constructor(e){super(e)}interpret_(e){return new ESObject({})}}export class N_statements extends Node{constructor(e,t){super(e),this.items=t}interpret_(e){let t;for(let r of this.items){const n=r.interpret(e);if(n.error||void 0!==n.funcReturn||n.shouldBreak||n.shouldContinue)return n;t=n.val}return t||new ESUndefined}}export class N_functionCall extends Node{constructor(e,t,r){super(e),this.arguments=r,this.to=t}interpret_(e){let{val:t,error:r}=this.to.interpret(e);if(r)return r;if(!t)return new TypeError(this.startPos,"any","undefined",void 0,"On function call");if(!t.__call__)return new TypeError(this.startPos,"unknown",(null==t?void 0:t.typeOf().valueOf())||"unknown",null==t?void 0:t.valueOf(),"Can only () on something with __call__ property");let n=[];for(let t of this.arguments){const r=t.interpret(e);if(r.error)return r.error;r.val&&n.push(r.val)}const s=t.__call__(n,e);return s instanceof ESError&&s.traceback.push({position:this.startPos,line:`${t.info.name}(${n.map(str).join(", ")})`}),s}}export class N_functionDefinition extends Node{constructor(e,t,r,n,s="(anon)",i=new ESObject,o=""){super(e),this.arguments=r,this.body=t,this.name=s,this.this_=i,this.returnType=n,this.description=o}interpret_(e){var t,r,n;let s=[];for(let t of this.arguments){const r=interpretArgument(t,e);if(r instanceof ESError)return r;s.push(r)}const i=this.returnType.interpret(e);return i.error?i.error:i.val instanceof ESType?new ESFunction(this.body,s,this.name,this.this_,i.val,e):new TypeError(this.returnType.startPos,"Type",null!==(r=null===(t=i.val)||void 0===t?void 0:t.typeOf().valueOf())&&void 0!==r?r:"<Undefined>",null===(n=i.val)||void 0===n?void 0:n.str().valueOf(),`On func '${this.name}' return type`)}}export class N_return extends Node{constructor(e,t){super(e),this.value=t}interpret_(e){const t=new interpretResult;if(void 0===this.value)return t.funcReturn=new ESUndefined,t;let r=this.value.interpret(e);return r.error?r.error:(t.funcReturn=r.val,t)}}export class N_yield extends Node{constructor(e,t){super(e),this.value=t}interpret_(e){var t;const r=new interpretResult;if(void 0===this.value)return r.funcReturn=new ESUndefined,r;let n=this.value.interpret(e);return n.error?n.error:((null===(t=n.val)||void 0===t?void 0:t.bool().valueOf())&&(r.funcReturn=n.val),r)}}export class N_indexed extends Node{constructor(e,t,r){super(e),this.base=t,this.index=r}declaredBinOp(e,t,r,n){return e.hasProperty(new ESString(r))?e[r](t):new ESError(n,"TypeError",`Unsupported operand ${r} on type ${e.typeOf().valueOf()}`)}interpret_(e){var t;let r=this.base.interpret(e);if(r.error)return r;let n=this.index.interpret(e);if(n.error)return n;const s=n.val,i=r.val;if(!i||!s)return new ESUndefined;if(void 0!==this.value){let r=this.value.interpret(e);if(r.error)return r;const n=ESPrimitive.wrap(i.__getProperty__(s));let o,a=r.val;if(null!==(t=this.assignType)&&void 0!==t||(this.assignType="="),!a)return new TypeError(this.startPos,"~undefined","undefined","undefined","N_indexed.interpret_");switch(this.assignType[0]){case"*":o=this.declaredBinOp(n,a,"__multiply__",this.startPos);break;case"/":o=this.declaredBinOp(n,a,"__divide__",this.startPos);break;case"+":o=this.declaredBinOp(n,a,"__add__",this.startPos);break;case"-":o=this.declaredBinOp(n,a,"__subtract__",this.startPos);break;case"=":o=a;break;default:return new ESError(this.startPos,"AssignError",`Cannot find assignType of ${this.assignType[0]}`)}if(o instanceof ESError)return o;if(!i.__setProperty__)return new TypeError(this.startPos,"mutable","immutable",i.valueOf());const l=i.__setProperty__(s,null!=o?o:new ESUndefined);if(l instanceof ESError)return l}return ESPrimitive.wrap(i.__getProperty__(s))}}export class N_class extends Node{constructor(e,t,r,n,s="<anon class>"){super(e),this.init=n,this.methods=t,this.name=s,this.extends_=r,this.instances=[]}interpret_(e){var t,r,n;const s=[];for(let r of this.methods){const n=r.interpret(e);if(n.error)return n.error;if(!(n.val instanceof ESFunction))return new TypeError(this.startPos,"Function",(null===(t=n.val)||void 0===t?void 0:t.typeOf().valueOf())||"undefined","method on "+this.name);s.push(n.val)}let i,o;if(this.extends_){const t=this.extends_.interpret(e);if(t.error)return t.error;if(!(t.val instanceof ESType))return new TypeError(this.startPos,"Function",(null===(r=t.val)||void 0===r?void 0:r.typeOf().valueOf())||"undefined","method on "+this.name);i=t.val}if(this.init){const t=this.init.interpret(e);if(t.error)return t.error;if(!(t.val instanceof ESFunction))return new TypeError(this.startPos,"Function",(null===(n=t.val)||void 0===n?void 0:n.typeOf().valueOf())||"undefined","method on "+this.name);o=t.val}return new ESType(!1,this.name,s,i,o)}}export class N_namespace extends Node{constructor(e,t,r="(anon)",n=!1){super(e),this.name=r,this.statements=t,this.mutable=n}interpret_(e){const t=new Context;t.parent=e;const r=this.statements.interpret(t);return r.error?r:new ESNamespace(new ESString(this.name),t.getSymbolTableAsDict(),this.mutable)}}export class N_number extends Node{constructor(e,t){super(e,!0),this.a=t}interpret_(e){let t=this.a.value;if("number"!=typeof t)return new TypeError(this.startPos,"number",typeof t);const r=new interpretResult;return r.val=new ESNumber(t),r}}export class N_string extends Node{constructor(e,t){super(e,!0),this.a=t}interpret_(e){let t=this.a.value;if("string"!=typeof t)return new TypeError(this.startPos,"string",typeof t);const r=new interpretResult;return r.val=new ESString(t),r}}export class N_variable extends Node{constructor(e){super(e.startPos,!0),this.a=e}interpret_(e){if(!e.has(this.a.value))return new ReferenceError(this.a.startPos,this.a.value);let t=new interpretResult,r=e.getSymbol(this.a.value);return r?r instanceof ESError?r:(t.val=r.value,t):new ESUndefined}}export class N_undefined extends Node{constructor(e=Position.unknown){super(e,!0)}interpret_(e){const t=new interpretResult;return t.val=new ESUndefined,t}}export class N_break extends Node{constructor(e){super(e,!0)}interpret_(e){const t=new interpretResult;return t.shouldBreak=!0,t}}export class N_continue extends Node{constructor(e){super(e,!0)}interpret_(e){const t=new interpretResult;return t.shouldContinue=!0,t}}export class N_any extends Node{constructor(e,t=Position.unknown){super(t,!0),this.val=e}interpret_(e){return this.val instanceof ESPrimitive?this.val:ESPrimitive.wrap(this.val)}}