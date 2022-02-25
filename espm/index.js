import install from './install';
import publish from './publish';
import {PACKAGE_DIR_NAME} from './util';
import {existsSync, mkdirSync} from 'fs';

function logWelcome () {
    console.log(`
Welcome to the Entropy Script Particle Manager.
See https://entropygames.io/entropy-script/pm for more information.
    
    Start by typing 'espm init' or 'espm install'
`);
}

/**
 * @param {string[]} cliArgs
 */
function main (cliArgs) {
    if (!existsSync(PACKAGE_DIR_NAME))
        mkdirSync(PACKAGE_DIR_NAME);

    if (!cliArgs.length) {
        logWelcome();
        return;
    }

    switch (cliArgs[0]) {
        case 'help':
            logWelcome();
            break;

        case 'install':
            install(cliArgs.slice(1));
            break;

        case 'publish':
            publish();
            break;

        default:
            console.log(`That is not a valid argument`);
    }
}

if (process.argv[0] === '/usr/local/bin/node')
    main(process.argv.slice(2));
else
    main(process.argv.slice(1));
