import {ESObject, ESPrimitive} from "../../runtime/primitiveTypes";

const module: ESObject = <ESObject>ESPrimitive.wrap(Math);

export default module;