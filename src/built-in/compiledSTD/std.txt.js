Array.prototype.contains = function (element) {
	return this.indexOf(element) !== -1;
};

function parseNum (str) {
	return parseFloat(str);
}

const print = console.log;

const __js_std__ = {
	bims: {
		math: Math,
		time: {
			date: Date,
			now: Date.now,
		},
	},
};

if (typeof performance !== 'undefined') {
	__js_std__.bims.time.now = performance.now;
}

function import_ (path) {
	if (__js_std__.bims.hasOwnProperty(path)) {
		return __js_std__.bims[path];
	}
}

function range (minP, maxP, stepP) {
	if (typeof minP !== 'number') {
		return [];
	}

	const min = minP.__value__;

	if (typeof maxP === 'undefined') {
		try {
			return [...Array(min).keys()];
		} catch (e) {
			throw `RangeError: Cannot make range of length '${min}'`;
		}
	}

	let step = 1;

	if (typeof maxP !== 'number') {
		throw 'TypeError: Expected number';
	}

	let max = maxP.__value__;

	if (typeof stepP !== 'undefined') {
		if (typeof stepP !== 'number') {
			throw 'TypeError: Expected number';
		}
		step = stepP.__value__;
	}

	let arr = [];

	let i = min;
	while (i < max) {
		arr.push(i);
		i += step;
	}

	return arr;
}