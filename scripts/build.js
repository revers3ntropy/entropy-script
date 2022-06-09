/**
 * '-s' option to build to stable
 */


const start = Date.now();

const { exec } = require('child_process');
const fs = require('fs');
const dts = require('dts-bundle');

const packageConf = JSON.parse(String(fs.readFileSync('./package.json')));
const version = packageConf['version'];

function run (cmd) {
	return new Promise(resolve => {
		exec(cmd, resolve);
	});
}

const WP_LOG_FILE = 'webpack-log.txt';

if (!fs.existsSync('build')) {
	fs.mkdirSync('build');
}

(async () => {

	await run (`touch ${WP_LOG_FILE}`);
	await run(`webpack --config webpack.config.js > ${WP_LOG_FILE}`);

	if (!fs.existsSync(`build/${version}.js`)) {
		console.log(String(fs.readFileSync(WP_LOG_FILE)));
		return;
	}

	await run(`cp build/${version}.js build/latest.js`);
	fs.writeFileSync(
		'build/latest.js',
		fs.readFileSync('build/latest.js').toString()
			.replace(`${version}.js.map`, 'latest.js.map')
	);
	await run(`cp build/${version}.js.map build/latest.js.map`);

	if (process.argv.includes('-s')) {
		await run(`cp build/${version}.js build/stable.js`);
		fs.writeFileSync(
			'build/stable.js',
			fs.readFileSync('build/stable.js').toString()
				.replace(`${version}.js.map`, 'stable.js.map')
		);
		await run(`cp build/${version}.js.map build/stable.js.map`);
	}

	// log the contents of the log file and then delete it
	console.log(String(fs.readFileSync(WP_LOG_FILE)));
	await run (`rm ${WP_LOG_FILE}`);

	// bundle the generated type definition files into a single index.d.ts with everything in it
	dts.bundle({
		name: 'entropy-script',
		main: 'src/index.d.ts',
		// idk why but ../ puts it in the right place
		out: '../index.d.ts',
	});

	console.log(`Compiled and bundled in ${Date.now() - start}ms`);
})();