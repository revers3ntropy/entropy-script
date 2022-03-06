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
