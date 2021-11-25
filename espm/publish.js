import {readConfig, __dirname, deleteRecursively} from './util.js';
import * as fs from 'fs';
import ncp from 'ncp';
import archiver from 'archiver';

export default async function () {
    const config = readConfig();

    if (!/^[A-Za-z\-0-9]+$/.test(config.name)) {
        console.log('Error: invalid project name. Project names must have only digits, dashes and letters in.');
        return;
    }

    const TEMP_PATH = config.name.toString();

    if (fs.existsSync(TEMP_PATH)) {
        console.log(`Path '${TEMP_PATH}' must not exist. Please delete this directory and try again.`);
        return;
    }

    if (fs.existsSync(TEMP_PATH + '.zip')) {
        console.log(`Path '${TEMP_PATH}.zip' must not exist. Please delete this file and try again.`);
        return;
    }

    fs.mkdirSync(TEMP_PATH);

    const exclude = new RegExp(config.exclude);

    // copy contents of current folder to temp folder
    ncp('./', TEMP_PATH, {
        filter: (name) => {
            if (new RegExp(`${process.cwd()}\/${TEMP_PATH}`).test(name))
                return false;
            if (!exclude) return true;
            return new RegExp(exclude).test(name);
        }
    }, async (err) => {
        if (err) {
            console.log('Error creating temp dir for project: ' + err);
            fs.rmdirSync(TEMP_PATH, {recursive: true});
            return;
        }
        console.log('...');

        // zipping

        const output = fs.createWriteStream(config.name+'.zip');
        const archive = archiver('zip', {
            zlib: {level: 9}
        });

        output.on('close',  () => {
            console.log('Particle has been compressed.');
            console.log(`Particle compressed size: ${archive.pointer()/1_000_000}MB`);

            if (!deleteRecursively(TEMP_PATH)) {
                console.log('Error removing temp folder, may have to delete manually');
            }
        });

        archive.on('error', err => {
            console.log(`Error compressing particle: ${err}`);
        });

        archive.pipe(output);

        // append files from a sub-directory, putting its contents at the root of archive
        archive.directory(TEMP_PATH, false);

        archive.finalize();
    });


}