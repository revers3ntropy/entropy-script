math = import('math');

for i in 99 {
	i += 1;

	div3 = i/3 == math.round(i/3);
	div5 = i/5 == math.round(i/5);


	if div3 && div5 {
		print('fizzbuzz');
	} else if div3 {
		print('fizz');
	} else if div5 {
		print('buzz');
	} else {
		print(i);
	}
}