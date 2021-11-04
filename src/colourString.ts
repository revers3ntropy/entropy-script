function addProperty (name: string, colour: string) {
    Object.defineProperty(String.prototype, name, {
        get: function () {
            return `\x1b[${colour}m` + this + '\x1b[0m';
        }
    });
}

addProperty('red', '31');
addProperty('yellow', '33');
addProperty('green', '32');
addProperty('cyan', '36');
addProperty('blue', '34');