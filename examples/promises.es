let Promise = import('Promise');

let myPromise = Promise(func (resolve, throw) {
    sleep(2000, func () {
        throw('failed');
        resolve('hello world');
    });
});

print('waiting...');

myPromise
    .then(func (value) {
        print('then');
    })
    .then(print)
    .catch(print);