import{Position}from"../position.js";import{Context}from"../runtime/context.js";import{ESError,ImportError}from"../errors.js";import{ESFunction,ESNamespace,ESObject,ESPrimitive,ESString,types}from"../runtime/primitiveTypes.js";import{str}from"../util/util.js";import{run}from"../index.js";import{getModule,moduleExist}from"./builtInModules.js";function addNodeLibs(e,t,r,n,o,i){o.set("import",new ESFunction((({context:e},t)=>{const n=str(t);if(moduleExist(n))return getModule(n);try{if(!r.existsSync(n))return new ESError(Position.unknown,"ImportError",`Can't find file '${n}' to import.`);const t=r.readFileSync(n,"utf-8"),o=new Context;o.parent=e;const s=run(t,{env:o,fileName:n});return s.error?i(new ImportError(Position.unknown,str(n),s.error.str).str):new ESNamespace(new ESString(n),o.getSymbolTableAsDict())}catch(e){return new ESError(Position.unknown,"ImportError",e.toString())}}),[{name:"path",type:types.string}],"import",void 0,types.object),{forceThroughConst:!0,isConstant:!0}),o.setOwn("https",new ESObject({createServer:new ESFunction((({context:r},n,o)=>{let s=ESPrimitive.strip(n),c=ESPrimitive.strip(o);s=Object.assign({port:3e3,secure:!1,debug:!1},s);const u=(e,t)=>{s.corsOrigin&&t.setHeader("Access-Control-Allow-Origin",s.corsOrigin);const r=e.url||"/";if(s.debug&&console.log(`Got request at ${r}`),c.hasOwnProperty(r)){let n="";e.on("data",(e=>{n+=e})),e.on("end",(()=>{t.writeHead(200);let o={};try{o=JSON.parse(null!=n?n:"{}")}catch(t){return void i(`Error parsing JSON data from URL ${e.url} with JSON ${n}: ${t}`)}const u=c[r];if(!u)return void i(`Not handler found for url '${r}'`);const a=new Context;a.parent=u.__closure__,a.set("body",new ESObject(o)),u.__closure__=a;const p=u.__call__([]);if(p instanceof ESError)return i(p.str),t.writeHead(500),void t.end("{}");let l="";try{if(!(p instanceof ESObject))return t.writeHead(500),void t.end("{}");l=JSON.stringify(ESPrimitive.strip(p))}catch(e){return i(`Incorrect return value for handler of ${r}. Must be JSONifyable.`),s.debug&&i(`Detail: Expected type (object|undefined) but got value ${p.valueOf()} of type ${p.typeOf()}`),t.writeHead(500),void t.end("{}")}s.debug&&i(`Response: ${l}`),t.end(l)}))}else t.writeHead(404),t.end("{}")};if(s.secure){const t=e.createServer({key:s.key,cert:s.cert},u);s.hostname?t.listen(s.port,s.hostname,(()=>{i(`Server running at https://${s.hostname}:${s.port}`)})):t.listen(s.port,(()=>{i(`Server running on port ${s.port}`)}))}else t.createServer(u).listen(s.port,s.hostname,(()=>{i(`Server running at http://${s.hostname}:${s.port}`)}))}))})),o.setOwn("open",new ESFunction(((e,t)=>{const n=e.valueOf(),o=(null==t?void 0:t.valueOf())||"utf-8";return new ESObject({str:new ESFunction((()=>new ESString(r.readFileSync(n,o))),[],"str",void 0,types.string),write:new ESFunction((({context:e},t)=>{r.writeFileSync(n,str(t))})),append:new ESFunction((({context:e},t)=>{r.appendFileSync(n,str(t))}))})}))),o.setOwn("mysql",new ESFunction((({context:e},t)=>{const r=t.valueOf(),o=new n(r);return new ESFunction((({context:e},t)=>o.query(t.valueOf())),[],"queryMySQL")})))}export default addNodeLibs;