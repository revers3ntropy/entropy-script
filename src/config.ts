import type { Map } from "./util/util";

export type Permissions = {
    networking: boolean;
    imports: boolean;
    accessDOM: boolean;
    useSTD: boolean;
    fileSystem: boolean,
} & Map;

export interface Config {
    permissions: Permissions,
    modules: Map,
}

const AllowAny = Symbol('AllowAny');

/**
 * Gets the default permissions settings.
 * Note that this is generally secure by default -
 * no networking or filesystem for example
 */
export function defaultPermissions (): Permissions {
    return {
        networking: false,
        imports: true,
        accessDOM: false,
        useSTD: true,
        fileSystem: false,
    };
}

export const config = {
    permissions: defaultPermissions(),
    modules: {
        // should really be boolean but resolves to true anyway, and prevents type clashes expecting strings
        [AllowAny]: 'y'
    },
};

/**
 * Converts a sequence of keys into a readable square-bracket indexing format
 */
function pathAsString (path: string[]) {
    let res = '[';
    for (const p of path) {
        res += p + '][';
    }
    return res.substring(0, res.length-1);
}

/**
 * Recursively looks at a config and tries to update another config based on it.
 * @param config
 * @param configJSON
 * @param path the sequence of keys leading from the root JSON object
 */
function parsePartOfConfig (config: Map, configJSON: Map, path: string[] = []) {
    if (!config[AllowAny]) {
        const unknownProps = Object.keys(configJSON).filter(x => !(x in config));

        for (const k of unknownProps) {
            console.error(`Cannot parse config`,
                ` - unknown property config${pathAsString([...path, k])}`);
        }
    }

    for (const key of Object.keys(configJSON)) {
        if (typeof config[key] !== typeof configJSON[key] && !config[AllowAny]) {
            console.error(`Cannot parse config`,
                ` - config${pathAsString([...path, key])} should be of type '${typeof config[key]}'`);
            return;
        }

        if (typeof config[key] === 'object') {
            parsePartOfConfig(config[key], configJSON[key], [...path, key]);
            continue;
        }
        config[key] = configJSON[key];
    }
}

export function parseConfig (configJSON: Map): void {
    parsePartOfConfig(config, configJSON);
}