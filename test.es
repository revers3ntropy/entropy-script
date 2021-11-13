var myFunc = func () {
	a = 'message';
    return func () {
    	print(a);
    };
};
print(myFunc()());
