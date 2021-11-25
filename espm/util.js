import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

/**
 * Matches version numbers like 1.0.0 and 2.17.8
 * @param {string} str
 * @returns {boolean}
 */
export function validVersionNumber (str) {
    return /^\d+(\.\d+){0,2}$/.matches(str);
}

/**
 * Deletes directory and contents of a path and all sub-dirs
 * @param {string} path
 * @returns {boolean} success
 */
export function deleteRecursively (path) {
    if (!fs.existsSync(path) ) return false;
    fs.readdirSync(path).forEach(file => {
        const curPath = path + "/" + file;
        if(fs.lstatSync(curPath).isDirectory()) { // recurse
            deleteRecursively(curPath);
        } else { // delete file
            fs.unlinkSync(curPath);
        }
    });
    fs.rmdirSync(path);
    return true;
}

export function readConfig () {
    // defaults
    let config = {
        name: "",
        bonds: [],
        exclude: "",
    };

    if (!fs.existsSync(CONFIG_FILE_NAME)) {
        fs.appendFileSync(CONFIG_FILE_NAME, '{}');
    }

    try {
        config = {
            ...config,
            ...JSON.parse(fs.readFileSync(CONFIG_FILE_NAME))
        };
    } catch (e) {
        console.log(`Cannot parse ${CONFIG_FILE_NAME}: ${e}`);
    }

    return config;
}

/**
 *
 * @param {CallableFunction} callback - takes and returns object of config value
 */
export function editConfig (callback) {
    const value = callback(readConfig());
    if (!value) return;
    fs.writeFileSync(CONFIG_FILE_NAME, JSON.stringify(value, null, 2));
}

// CONSTANTS

export const PACKAGE_DIR_NAME = 'particles';
export const CONFIG_FILE_NAME = 'particle.json';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);