import type { dict } from "./util/util";

export interface config {
    permissions: {
        networking: boolean;
        imports: boolean;
        accessDOM: boolean;
        useSTD: boolean;
        fileSystem: boolean,

        [k: string]: any
    }
}

export const config = {
    permissions: {
        networking: false,
        imports: true,
        accessDOM: false,
        useSTD: true,
        fileSystem: false,
    }
};

function pathAsString (path: string[]) {
    let res = '[';
    for (let p of path) {
        res += path + '][';
    }
    return res.substring(0, res.length-2);
}

function parsePartOfConfig (config: dict<any>, configJSON: dict<any>, path: string[]=[]) {
    for (let key of Object.keys(config)) {
        if (!configJSON.hasOwnProperty(key)) {
            continue;
        }
        if (typeof config[key] !== typeof configJSON[key]) {
            console.log(`Cannot parse config - config${pathAsString(path)} should be of type '${typeof config[key]}'`);
            return;
        }
        if (typeof config[key] === 'object') {
            parsePartOfConfig(config[key], configJSON[key], [...path, key]);
            continue;
        }
        config[key] = configJSON[key];
    }
}

export function parseConfig (configJSON: dict<any>): void {
    parsePartOfConfig(config, configJSON);
}