const lib = import('./lib/main.es');

const main = func () {
	return lib.doThing();
};

print(main());