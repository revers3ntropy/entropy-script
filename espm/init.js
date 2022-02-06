import fs from 'fs';
import {CONFIG_FILE_NAME, PACKAGE_DIR_NAME} from "./util.js";

const TEMPLATE_PARTICLE_JSON = `
{
    "name": "",
    "bonds": [],
    "exclude": ""
}
`;

export default function () {
	if (!fs.existsSync(PACKAGE_DIR_NAME)) {
		fs.mkdirSync(PACKAGE_DIR_NAME);
	}

	if (!fs.existsSync(CONFIG_FILE_NAME)) {
		fs.writeFileSync(CONFIG_FILE_NAME, TEMPLATE_PARTICLE_JSON);
	}
}