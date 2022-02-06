import fs from 'fs';

// CONSTANTS

export const PACKAGE_DIR_NAME = 'particles';
export const CONFIG_FILE_NAME = 'particle.json';

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

/**
 *
 * @param {string} dir=''
 * @returns {any} config
 */
export function readConfig (dir='') {
    // defaults
    let config = {
        name: "",
        bonds: [],
        exclude: "",
    };

    dir += CONFIG_FILE_NAME

    if (!fs.existsSync(dir)) {
        fs.appendFileSync(dir, '{}');
    }

    try {
        config = {
            ...config,
            ...JSON.parse(fs.readFileSync(dir).toString())
        };
    } catch (e) {
        console.log(`Cannot parse ${dir}: ${e}`);
    }

    return config;
}

/**
 * @param {string} dir=''
 * @param {CallableFunction} callback - takes and returns object of config value
 */
export function editConfig (callback, dir='') {
    const value = callback(readConfig(dir));
    if (!value) return;
    fs.writeFileSync(CONFIG_FILE_NAME, JSON.stringify(value, null, 2));
}