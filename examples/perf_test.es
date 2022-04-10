let [ now ] = import('time');

func main () {
    let var sum = 0;
    for i in 100 {
        for j in 100 {
            sum += i;
         	sum += j;
        }
    }
    print(sum);
};

if __main__ {
	let start = now();

	for i in 10 {
		sleep(0, main);
	}

	print(now() - start);
}
