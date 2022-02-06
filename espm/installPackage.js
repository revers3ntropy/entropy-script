import * as fs from 'fs';
import request from 'request';
import urlExist from 'url-exist';
import admZip from 'adm-zip';
import {installListOfDeps} from './install.js';
import {editConfig, PACKAGE_DIR_NAME} from './util.js';

/**
 * Checks to see if package can be downloaded
 * @param {string} packageName
 * @returns {Promise<boolean>}
 */
export async function canInstallPackage (packageName) {
    return await urlExist(`https://entropygames.io/entropy-script/pm/particles/${packageName}.zip`);
}

/**
 * Adds the name of a package to the requirements in the local config file
 * @param {string} packageName
 * @returns {boolean} success
 */
export function addPackageToConfig (packageName) {
    editConfig(config => {

        if (!Array.isArray(config['bonds'])) {
            config['bonds'] = [];
        }

        config['bonds'].push(packageName);

        return config;
    });
}

/**
 * Downloads package. Assumed that the package exists at the url:
 *  http://entropygames.io/entropy-script/pm/particles/{packageName}.zip
 * and that the particles root dir exists
 * @param {string} packageName
 * @returns {Promise<boolean>} success
 */
export default async function (packageName) {
    if (fs.existsSync(PACKAGE_DIR_NAME + '/' + packageName)) {
        return true;
    }

    const url = `http://entropygames.io/entropy-script/pm/particles/${packageName}.zip`;
    const localTempPath = `tmp-${packageName}.zip`;

    // download the zipped file
    await (new Promise((resolve) => {
        // https://stackoverflow.com/questions/12029523/node-downloading-a-zip-through-request-zip-being-corrupted
        request(url)
            .pipe(fs.createWriteStream(localTempPath))
            .on('close', () => {
                console.log(`Particle '${packageName}' downloaded`);
                resolve();
            });
    }));

    // unzip the file

    const zip = new admZip(localTempPath);
    if (!fs.existsSync(PACKAGE_DIR_NAME + '/' + packageName))
        fs.mkdirSync(PACKAGE_DIR_NAME + '/' + packageName);
    zip.extractAllTo(PACKAGE_DIR_NAME + '/' + packageName, true);

    console.log(`Particle '${packageName}' unzipped`);

    fs.rmSync(localTempPath);

    // install dependencies for newly installed particle
    if (!fs.existsSync(PACKAGE_DIR_NAME + '/' + packageName + '/particle.json')) {
        console.log(`Error installing dependencies for particle '${packageName}': particle.json not found.`);
        return false;
    }

    return await new Promise(async resolve => {
        editConfig(async config => {

            let packages = config['bonds'];

            if (!Array.isArray(packages)) {
                config['bonds'] = [];
                packages = [];
            }

            if (!packages.length) {
                resolve();
                return config;
            }

            const idx = packages.indexOf(config.name);
            if (idx !== -1) {
                packages.splice(idx, 1);
            }

            console.log(`Installing dependencies of ${packageName}...`);

            await installListOfDeps(packages);

            resolve();
            return config;
        }, PACKAGE_DIR_NAME + '/' + packageName + '/');
    });
}