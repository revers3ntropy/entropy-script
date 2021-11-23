import{ESError,TestFailed}from"../errors.js";import{run}from"../index.js";import{Context,ESSymbol}from"../runtime/context.js";import{global,now}from"../constants.js";import{str}from"../util/util.js";import{ESFunction,ESPrimitive,ESType}from"../runtime/primitiveTypes.js";export class TestResult{constructor(){this.time=0,this.failed=0,this.passed=0,this.fails=[]}register(t){if("boolean"!=typeof t){if(t instanceof ESError)return this.failed++,void this.fails.push(t);this.failed+=t.failed,this.passed+=t.passed}else t?this.passed++:this.failed++}str(){return`\n            ---   TEST REPORT   ---\n                ${this.failed.toString()[this.failed<1?"green":"red"]} tests failed\n                ${this.passed.toString().green} tests passed\n                \n            In ${this.time.toString().cyan}ms\n            \n            ${0===this.failed?"All tests passed!".green:""}\n            \n            ${this.fails.map((t=>`\n-----------------\n${t.str}\n`))}\n        `}}export class Test{constructor(t,e="test"){this.id=e,this.test=t}run(t){return this.test(t)}static test(t){Test.tests.push(new Test(t,Test.tests.length))}static testAll(){const t=new TestResult;let e=now();for(let e of Test.tests){global.resetAsGlobal();const r=new Context;r.parent=global,t.register(e.run(r))}return t.time=Math.round(now()-e),t}}function objectsSame(t,e){if(t instanceof ESFunction||t instanceof ESType||t instanceof ESSymbol)return e===t.str().valueOf();if(e instanceof ESFunction||e instanceof ESType||e instanceof ESSymbol)return t===e.str().valueOf();if("object"!=typeof t||"object"!=typeof e)return!1;for(let r in t){if(!e.hasOwnProperty(r))return!1;const n=t[r],s=e[r];if(Array.isArray(n))return arraysSame(n,s);if("object"==typeof n||"object"==typeof s)return objectsSame(n,s)||objectsSame(s,n);if(n!==s)return!1}return!0}function arraysSame(t,e){if(!Array.isArray(t)||!Array.isArray(e))return!1;if(t.length!==e.length)return!1;for(let r=0;r<t.length;r++){if(Array.isArray(t[r])||Array.isArray(e[r]))return arraysSame(t[r],e[r]);if(e[r]instanceof ESFunction||e[r]instanceof ESType)return t[r]===e[r].str().valueOf();if(t[r]instanceof ESFunction||t[r]instanceof ESType)return e[r]===t[r].str().valueOf();if("object"==typeof t[r]||"object"==typeof e[r])return objectsSame(t[r],e[r])||objectsSame(e[r],t[r]);if(t[r]!==e[r])return!1}return!0}Test.tests=[];export function expect(t,e){Test.test((r=>{var n;let s;try{s=run(e,{env:r})}catch(t){return new TestFailed(`Tried to run, but got error: ${t}. With code: ${e}`)}let i=null===(n=s.val)||void 0===n?void 0:n.valueOf();if(s.error&&Array.isArray(t))return new TestFailed(`Unexpected error encountered when running test. Expected '${t}' but got error: \n${s.error.str}\nwith code \n'${e}'\n`);if(function(){var e,r,n;return s.error||"string"==typeof t?!!s.error&&(!Array.isArray(t)&&(null!==(n=null===(r=null===(e=null==s?void 0:s.error)||void 0===e?void 0:e.constructor)||void 0===r?void 0:r.name)&&void 0!==n?n:"Error")===t):(arraysSame(t,ESPrimitive.strip(s.val))||console.log("%%",t,str(ESPrimitive.strip(s.val)),"@@"),arraysSame(t,ESPrimitive.strip(s.val)))}())return!0;const o=s.error||i;return new TestFailed(`Expected \n'${str(t)}' \n but got \n'${str(o)}'\n instead from test with code \n'${e}'\n`)}))}