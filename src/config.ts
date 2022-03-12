import type { dict } from "./util/util";
import chalk from './util/colours';

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
        res += p + '][';
    }
    return res.substring(0, res.length-1);
}

function parsePartOfConfig (config: dict<any>, configJSON: dict<any>, path: string[]=[]) {
    const configKeys = Object.keys(config);
    const unknownProps = Object.keys(configJSON).filter(x => !configKeys.includes(x));
    for (const k of unknownProps) {
        console.error(chalk.red(`Cannot parse config`),
            ` - unknown property config${chalk.yellow(pathAsString([...path, k]))}`);
    }
    for (let key of configKeys) {
        if (!configJSON.hasOwnProperty(key)) {
            continue;
        }
        if (typeof config[key] !== typeof configJSON[key]) {
            console.error(chalk.red(`Cannot parse config`),
                ` - config${chalk.yellow(pathAsString([...path, key]))} should be of type '${chalk.yellow(typeof config[key])}'`);
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