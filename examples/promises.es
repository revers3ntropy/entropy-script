let Promise = import('Promise');

let myPromise = Promise(func (resolve, fail) {
    sleep(2000, func () {
        fail('failed');
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