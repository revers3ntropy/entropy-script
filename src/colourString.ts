import { IS_NODE_INSTANCE } from "./constants.js";

function addProperty (name: string, colour: string) {
    Object.defineProperty(String.prototype, name, {
        get: function () {
            if (IS_NODE_INSTANCE)
                return `\x1b[${colour}m` + this + '\x1b[0m';
            return '<span style="color: red">' + this + '</span>';
        }
    });
}

addProperty('red', '31');
addProperty('yellow', '33');
addProperty('green', '32');
addProperty('cyan', '36');
addProperty('blue', '34');