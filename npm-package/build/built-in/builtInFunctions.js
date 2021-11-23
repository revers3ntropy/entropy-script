import{ESError,TypeError}from"../errors.js";import{Position}from"../position.js";import{ESArray,ESFunction,ESNamespace,ESNumber,ESObject,ESPrimitive,ESString}from"../runtime/primitiveTypes.js";import{indent,sleep,str}from"../util/util.js";export const builtInFunctions={range:[({context:n},e)=>{if(!(e instanceof ESNumber))return new TypeError(Position.unknown,"Number",e.typeOf().valueOf(),e.valueOf());const r=e.valueOf();try{return new ESArray([...Array(r).keys()].map((n=>new ESNumber(n))))}catch(n){return new ESError(Position.unknown,"RangeError",`Cannot make range of length '${str(e)}'`)}},{args:[{name:"N",type:"Number"}],description:"Generates an array of integers given N. Starts at 0 and goes to N-1. Can be used like for (i in range(10)) ..., similarly to python.",returns:"array of numbers from 0 to N-1",returnType:"number[] | RangeError"}],log:[({context:n},...e)=>{console.log(...e.map((n=>str(n))))},{args:[{name:"...values",type:"any[]"}],description:"Uses console.log to log all values",returnType:"void"}],parseNum:[({context:n},e)=>{try{const n=parseFloat(str(e));return isNaN(n)?new ESNumber:new ESNumber(n)}catch(n){return new TypeError(Position.unknown,"String",e.typeOf().valueOf(),e.valueOf(),"This string is not parse-able as a number")}},{args:[{name:"num",type:"any"}],description:"Converts a string of digits into a number. Works with decimals and integers. Calls .str() on value before using native JS 'parseFloat' function. Returns TypeError if the string can't be converted into a number.",returnType:"number | TypeError"}],help:[({context:n},...e)=>{var r;if(!e.length)return new ESString("\nVisit https://entropygames.io/entropy-script for help with Entropy Script!\nTry 'help(object)' for help about a particular object.\n");let t="";for(const n of e){const e=n.info;if(t+=`${`Help on '${e.name||"(anonymous)".yellow}'`.yellow}:\n    \n    ${"Value".yellow}: ${indent(indent(str(n)))}\n    ${"Type".yellow}: '${str(n.typeOf())}'\n    ${"Location".yellow}: ${e.file||"(unknown)".yellow}\n    \n        ${(null===(r=e.description)||void 0===r?void 0:r.green)||"No description."}\n        \n    ${e.helpLink?(e.helpLink+"\n\n").cyan:""}\n`,e.args&&n instanceof ESFunction){const n=e.args.length,r=e.args.filter((n=>n.required)).length;t+=n==r?`    Arguments (${n}): \n`.yellow:`    Arguments (${r}-${n}): \n`.yellow;for(const[n,r]of e.args.entries())t+="object"!=typeof r?`        ${n+1}. INVALID ARG INFO`:`        ${n+1}. ${r.name}${r.required?" ":" (optional) ".yellow}{${r.type}} ${r.description||""}\n`;t+="\n\n",e.returns&&(t+=`    Returns: ${e.returns}\n\n`),e.returnType&&(t+=`    Return Type: ${e.returnType}\n\n`)}if(e.contents&&(n instanceof ESObject||n instanceof ESNamespace)){t+="    Properties: \n      ";for(let n of e.contents)t+=n.name+"\n      "}}return console.log(t),e.length>1?new ESArray(e):e?e[0]:void 0},{args:[{name:"value",type:"any"}],description:"logs info on value",returns:"value passed in"}],describe:[({context:n},e,r)=>(e.info.description=str(r),e),{args:[{name:"value",type:"any"},{name:"description",type:"string"}],description:"Adds a description to whatever is passed in. Can be seen by calling help(value). Add more details with the 'detail' function",returns:"the value passed in",returnType:"any"}],detail:[({context:n},e,r)=>r instanceof ESObject?e.info.isBuiltIn?new ESError(Position.unknown,"TypeError",`Can't edit info for built-in value ${e.info.name} with 'detail'`):(e.info=ESPrimitive.strip(r),e.info.isBuiltIn=!1,e):new TypeError(Position.unknown,"object",str(r.typeOf()),str(r)),{args:[{name:"value",type:"any"},{name:"info",type:"   Info {\n        name?: string,\n        description?: string,\n        file?: string,\n        helpLink?: string,\n        args?: {\n            name?: string,\n            type?: string,\n            description?: string,\n            required?: boolean\n        }[],\n        returns?: string,\n        returnType?: string,\n        contents?: Info[]\n    }"}],returns:"the value passed"}],cast:[({context:n},e)=>{},{}],using:[({context:n},e)=>{if(!(e instanceof ESNamespace))return new TypeError(Position.unknown,"Namespace",str(e.typeOf()));const r=e.valueOf();for(const e in r)n.setOwn(e,r[e].value,{isConstant:r[e].isConstant,isAccessible:r[e].isAccessible,forceThroughConst:!0})},{}],sleep:[({context:n},e,r)=>e instanceof ESNumber?r instanceof ESFunction?void sleep(e.valueOf()).then((()=>{const n=r.__call__([]);n instanceof ESError&&console.log(n.str)})):new TypeError(Position.unknown,"function",str(r.typeOf()),str(r)):new TypeError(Position.unknown,"number",str(e.typeOf()),str(e)),{}]};