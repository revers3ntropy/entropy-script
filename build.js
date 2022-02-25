const { exec } = require('child_process');
const fs = require('fs');

const packageConf = JSON.parse(String(fs.readFileSync('./package.json')));
const version = packageConf['version'];

function run (cmd) {
	return new Promise(resolve => {
		exec(cmd, resolve);
	});
}

const WP_LOG_FILE = 'webpack-log.txt';

(async () => {
	const start = Date.now();

	await run (`touch ${WP_LOG_FILE}`);
	await run(`webpack --config webpack.config.js > ${WP_LOG_FILE}`);

	await run(`cp build/${version}.js build/latest.js`);
	await run(`cp build/${version}.js.map build/latest.js.map`);

	if (process.argv.includes('--stable')) {
		await run(`cp build/${version}.js build/stable.js`);
		await run(`cp build/${version}.js.map build/stable.js.map`);
	}

	console.log(String(fs.readFileSync(WP_LOG_FILE)));

	await run (`rm ${WP_LOG_FILE}`);

	console.log(`Compiled and bundled in ${Date.now() - start}ms`);
})();