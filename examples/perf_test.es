let [ now ] = import('time');

func main (n) {
    let var sum = 0;
    for i in n {
        for j in n {
            sum += i;
         sum += j;
        }
    }
    sum;
};

for i in range(10, 500, 10) {
    let start = now();
    main(i);
    print(i, ': ', (now() - start)/(i^2));
}
