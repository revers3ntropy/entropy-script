Array.prototype.contains = function (element) {
	return this.indexOf(element) !== -1;
};

function parseNum (str) {
	return parseFloat(str);
}

const print = console.log;

Number.prototype[Symbol.iterator] = function () {
	return {
		current: 0,
		last: this,
		next() {
			if (this.current <= this.last) {
				return { done: false, value: this.current++ };
			} else {
				return { done: true };
			}
		}
	};
};

const private = {
	bims: {
		math: Math
	}
};

function import_ (path) {
	if (private.bims.hasOwnProperty(path)) {
		return private.bims[path];
	}
}

function range (minP, maxP, stepP) {
	if (typeof minP !== 'number') {
		return [];
	}

	const min = minP.valueOf();

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

	let max = maxP.valueOf();

	if (typeof stepP !== 'undefined') {
		if (typeof stepP !== 'number') {
			throw 'TypeError: Expected number';
		}
		step = stepP.valueOf();
	}

	let arr = [];

	let i = min;
	while (i < max) {
		arr.push(i);
		i += step;
	}

	return arr;
}