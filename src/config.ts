import type { Map } from "./util/util";

export type Permissions = {
    networking: boolean;
    imports: boolean;
    accessDOM: boolean;
    useSTD: boolean;
    fileSystem: boolean,
} & Map;

const AllowAny = Symbol('AllowAny');

export function defaultPermissions (): Permissions {
    return {
        networking: false,
        imports: true,
        accessDOM: false,
        useSTD: true,
        fileSystem: false,
    };
}

interface IConfiguration {
    permissions: Permissions;
    modules: Map;
}

export const config: IConfiguration = {
    permissions: defaultPermissions(),
    modules: {
        // should really be boolean but resolves to true anyway, and prevents type clashes expecting strings
        [AllowAny]: 'y'
    },
};

function pathAsString (path: string[]) {
    let res = '[';
    for (const p of path) {
        res += p + '][';
    }
    return res.substring(0, res.length-1);
}

function parsePartOfConfig (config: Map, configJSON: Map, path: string[]=[]) {
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