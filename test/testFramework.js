const es = require('../build/latest.js');

/**
 * @name testExecutor
 * @function
 * @param {Context} env
 * @returns {boolean | ESError}
 */

class TestResult {
    failed = 0;
    passed = 0;
    /** @type {[Test, ESError][]}*/
    fails = [];
    time = 0;

    /**
     * @param {Test} test
     * @param {ESError | boolean | TestResult} res
     */
    register (test, res) {
        if (typeof res === 'boolean') {
            if (res) {
                this.passed++;
            } else {
                this.failed++;
            }
            return;
        }

        if (res instanceof es.ESError) {
            this.failed++;
            this.fails.push([test, res]);
            return;
        }

        this.failed += res.failed;
        this.passed += res.passed;
    }

    str () {
        return `
            ---   TEST REPORT   ---
                ${(this.failed.toString())[this.failed < 1 ? 'green' : 'red']} tests failed
                ${this.passed.toString().green} tests passed
                
            In ${this.time.toFixed(0).cyan}ms
            
            ${this.failed === 0 ? 'All tests passed!'.green : ''}
            
            ${this.fails.map(([test, error]) =>
                `\n ${test.batteryName} (#${test.batteryID}${error.pos.isUnknown ? '' : ` ${error.pos.ln}:${error.pos.col}`})`
            )}
        
            ${this.fails.map(([test, error]) =>
                `\n----------------- ${test.batteryName} (#${test.batteryID}): \n${error.colouredStr}\n`
            )}
        `;
    }
}

exports.TestResult = TestResult;

class Test {
    test;
    id;
    batteryName;
    batteryID;

    /**
     * @param {testExecutor} test
     * @param {string | number} id
     * @param {string} batteryName
     * @param {number} batteryID
     */
    constructor (test, id = 'test', batteryName='', batteryID = 0) {
        this.id = id;
        this.test = test;
        this.batteryName = batteryName;
        this.batteryID = batteryID;
    }

    /**
     * @param {Context} env
     * @returns {boolean | ESError}
     */
    run (env) {
        return this.test(env);
    }

    /** @type {Test[]} */
    static tests = [];

    /**
     * @param {string} batteryName
     * @param {testExecutor} test
     * @param {number} batteryID
     */
    static test (batteryName, test, batteryID) {
        Test.tests.push(new Test(test, Test.tests.length, batteryName, batteryID));
    }

    /**
     * @returns {TestResult}
     */
    static testAll () {
        let time = es.now();

        const res = new TestResult();

        global.path = __dirname;

        for (let test of Test.tests) {
            const testEnv = new es.Context();
            testEnv.parent = es.global;
            res.register(test, test.run(testEnv));
        }

        res.time = Math.round(es.now() - time);

        return res;
    }
}

exports.Test = Test;

function objectsSame (primary, secondary) {
    if (primary instanceof es.ESFunction || primary instanceof es.ESType || primary instanceof es.ESSymbol) {
        return secondary === primary.str().valueOf();
    }
    if (secondary instanceof es.ESFunction || secondary instanceof es.ESType || secondary instanceof es.ESSymbol) {
        return primary === secondary.str().valueOf();
    }

    if (typeof primary !== 'object' || typeof secondary !== 'object') {
        return false;
    }

    if (Object.keys(primary).length !== Object.keys(secondary).length) {
        return false;
    }

    for (let key of Object.keys(primary)) {
        if (!secondary.hasOwnProperty(key)) {
            return false;
        }

        const pValue = primary[key];
        const sValue = secondary[key];

        if (Array.isArray(pValue)) {
            if (!arraysSame(pValue, sValue)) {
                return false;
            }
        } else if (typeof pValue === 'object' || typeof sValue === 'object') {
            if (!objectsSame(pValue, sValue) || !objectsSame(sValue, pValue)) {
                return false;
            }
        } else if (typeof pValue === 'function') {
            if (sValue !== '<Func>') {
                return false;
            }

        } else if (typeof sValue === 'function') {
            if (pValue !== '<Func>') {
                return false;
            }
        } else if (pValue !== sValue) {
            return false;
        }
    }
    return true;
}

/**
 * @param {any[]} arr1
 * @param {any[]} arr2
 * @returns {boolean}
 */
function arraysSame (arr1, arr2) {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
        return false;
    } else if (arr1.length !== arr2.length) {
        return false;
    }

    for (let i = 0; i < arr1.length; i++) {
        const item1 = arr1[i], 
            item2 = arr2[i];

        if (Array.isArray(item1) || Array.isArray(item2)) {
            if (!arraysSame(item1, item2)) {
                return false;
            }

        } else if (item2 instanceof es.ESFunction || item2 instanceof es.ESType) {
            if (item1 !== item2.str().valueOf()) {
                return false;
            }

        } else if (item1 instanceof es.ESFunction || item1 instanceof es.ESType) {
            if (item2 !== item1.str().valueOf()) {
                return false;
            }

        } else if (typeof item1 === 'object' || typeof item2 === 'object') {
            if (!objectsSame(item1, item2) || !objectsSame(item2, item1)) {
                return false;
            }
        } else if (typeof item1 === 'function') {
            if (item2 !== '<Func>') {
                return false;
            }

        } else if (typeof item2 === 'function') {
            if (item1 !== '<Func>') {
                return false;
            }

        } else if (item1 !== item2) {
            return false;
        }
    }
    return true;
}

let currentFile = '';
let currentID = 0;
export function file (name) {
    currentFile = name;
    currentID = -1;
}

/**
 * @param {any[] | string} expected
 * @param {string} from
 */
function expect (expected, from) {
    currentID++;
    Test.test(currentFile, env => {
        /** @type {interpretResult | ({ timeData: timeData } & interpretResult)} */
        let result;
        try {
            result = es.run(from, {
                env,
                fileName: 'TEST_ENV'
            });
        } catch (err) {
            return new es.TestFailed(err.stack);
        }

        let resVal = es.strip(result.val);

        if (result.error && Array.isArray(expected)) {
            return result.error;
        }

        const res = (() => {
            if (result.error || typeof expected === 'string') {
                if (!result.error || Array.isArray(expected)) {
                    return false;
                }

                let name = result?.error?.constructor?.name;
                if (result.error.name) {
                    name = result.error.name;
                }
                return (name || 'Error') === expected;
            }

            const res = arraysSame(expected, es.strip(result.val));

            //* extreme debugging
            if (!res) {
                console.log('\n%%%', expected, es.str(es.strip(result.val)), '@@');
            }
            //*/

            return res;
        })();

        if (res) {
            return true;
        }

        const val = result.error || resVal;

        return new es.TestFailed(
            `${'Expected'.yellow} \n'${es.str(expected)}' \n ${'but got'.yellow} \n'${str(val)}'\n ${'instead from test with code'.yellow} \n'${from}'\n`
        );

    }, currentID);
}
exports.expect = expect;