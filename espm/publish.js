import {readConfig, deleteRecursively} from './util';
import * as fs from 'fs';
import ncp from 'ncp';
import archiver from 'archiver';
import request from 'request';

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

export default async function () {
    const config = readConfig();

    if (!/^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(config.name)) {
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
            return !((new RegExp(exclude)).test(name));
        }
    }, async (err) => {
        if (err) {
            console.log('Error creating temp dir for project: ' + err);
            fs.rmdirSync(TEMP_PATH, {recursive: true});
            return;
        }
        console.log('Compressing...');

        // zipping

        const output = fs.createWriteStream(config.name+'.zip');
        const archive = archiver('zip', {
            zlib: {level: 9}
        });

        output.on('close',  () => {
            console.log('Particle has been compressed.');
            const mb = archive.pointer()/1_000_000;
            console.log(`Particle compressed size: ${mb.toFixed(2)}MB`);

            if (!deleteRecursively(TEMP_PATH)) {
                console.log('Error removing temp folder, may have to delete manually');
            }

            console.log('Uploading....');
            // upload file to server

            request.post(
                {
                    url: 'https://entropygames.io/entropy-script/pm/publish.php',
                    headers: {'Content-Type':'multipart/form-data'},
                    formData: {
                        particleToUpload: fs.createReadStream(config.name+'.zip'),
                    }
                }, (err, httpResponse, body) => {
                    fs.rmSync(config.name+'.zip');
                    if (err) {
                        console.log(`Error uploading particle: ${err}`);
                    } else {
                        if (body == '1')
                            console.log('Uploaded Successfully!');
                        else
                            console.log(`Error uploading particle: ${body}`);
                    }
                });
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