const es = require('../build/latest.js');
const path = require('path');

/**
 * @name testExecutor
 * @function
 * @param {Context} env
 * @returns {boolean | Error}
 */
class TestResult {
    failed = 0;
    passed = 0;
    /** @type {[Test, Error][]}*/
    fails = [];
    time = 0;

    /**
     * @param {Test} test
     * @param {Error | boolean | TestResult} res
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

        if (res instanceof es.Error) {
            this.failed++;
            this.fails.push([test, res]);
            return;
        }

        this.failed += res.failed;
        this.passed += res.passed;
    }

    str (verbose=false) {
        return `
            ---   TEST REPORT   ---
                ${es.colours[this.failed < 1 ? 'green' : 'red'](this.failed.toString())} tests failed
                ${es.colours.green(this.passed.toString())} tests passed
                
            In ${es.colours.cyan(this.time.toFixed(0))}ms
            
            ${this.failed === 0 ? es.colours.green('All tests passed!') : ''}
            
            ${this.fails.map(([test, error]) =>
                `\n ${test.batteryName} (#${test.batteryID+1}${error.pos.isVoid ? '' : ` ${error.pos.ln+1}:${error.pos.col+1}`})`
            )}
        
            ${!verbose ? '' :this.fails.map(([test, error]) =>
                `\n----------------- ${test.batteryName} (#${test.batteryID+1}): \n${error.colouredStr}\n`
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
     * @returns {boolean | Error}
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

        for (let test of Test.tests) {
            const testEnv = new es.Context();
            testEnv.parent = es.global;
            testEnv.path = path.resolve(__dirname);
            res.register(test, test.run(testEnv));
        }

        res.time = Math.round(es.now() - time);

        return res;
    }
}

exports.Test = Test;

function objectsSame (primary, secondary) {
    if (primary instanceof es.ESFunction || primary instanceof es.ESType || primary instanceof es.ESSymbol) {
        return secondary === primary.str().__value__;
    }
    if (secondary instanceof es.ESFunction || secondary instanceof es.ESType || secondary instanceof es.ESSymbol) {
        return primary === secondary.str().__value__;
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
            if (item1 !== item2.str().__value__) {
                return false;
            }

        } else if (item1 instanceof es.ESFunction || item1 instanceof es.ESType) {
            if (item2 !== item1.str().__value__) {
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
function file (name) {
    currentFile = name;
    currentID = -1;
}
exports.file = file;

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

        // wrap in function to make returning easier to handle
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

            const res = arraysSame(expected, es.strip(result.val, {context: env}));

            if (!res && process.argv.indexOf('-d') !== -1) {
                console.log('\n%%%', expected, es.str(es.strip(result.val, {context: env})), '@@');
            }

            return res;
        })();

        if (res) {
            return true;
        }

        const val = result.error || resVal;

        return new es.TestFailed(
            `${es.colours.yellow('Expected')} \n'${es.str(expected)}' 
            ${es.colours.yellow('but got')} \n'${es.str(val)}'
            ${es.colours.yellow('instead from test with code')}
            '${from}'
        `);

    }, currentID);
}
exports.expect = expect;