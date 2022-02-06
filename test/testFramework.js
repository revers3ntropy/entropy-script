import { run } from "../build/index.js";
import { ESError, TestFailed } from "../build/errors.js";
import { Context, ESSymbol } from "../build/runtime/context.js";
import { global, now } from "../build/constants.js";
import { str } from "../build/util/util.js";
import { ESFunction, ESPrimitive, ESType } from "../build/runtime/primitiveTypes.js";
import { interpretResult } from "../build/runtime/nodes.js";


export class TestResult {
    failed = 0;
    passed = 0;
    fails = [];
    time = 0;

    /**
     * @param { ESError | boolean | TestResult } res
     */
    register (res) {
        if (typeof res === 'boolean') {
            if (res) {
                this.passed++;
            } else {
                this.failed++;
            }
            return;
        }

        if (res instanceof ESError) {
            this.failed++;
            this.fails.push(res);
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
                
            In ${this.time.toString().cyan}ms
            
            ${this.failed === 0 ? 'All tests passed!'.green : ''}
            
            ${this.fails.map(error => `\n-----------------\n${error.str}\n`)}
        `;
    }
}

export class Test {
    test;
    id;

    /**
     * @param {(env: Context) => boolean | ESError} test
     * @param {string | number} id
     */
    constructor(test, id = 'test') {
        this.id = id;
        this.test = test;
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
     * @param {(env: Context) => (boolean | ESError)} test
     */
    static test (test) {
        Test.tests.push(new Test(test, Test.tests.length));
    }

    /**
     * @returns {TestResult}
     */
    static testAll () {
        const res = new TestResult();

        let time = now();

        for (let test of Test.tests) {
            const testEnv = new Context();
            testEnv.parent = global;
            testEnv.path = './';
            res.register(test.run(testEnv));
        }

        res.time = Math.round(now() - time);

        return res;
    }
}

function objectsSame(primary, secondary) {
    if (primary instanceof ESFunction || primary instanceof ESType || primary instanceof ESSymbol)
        return secondary === primary.str().valueOf();
    if (secondary instanceof ESFunction || secondary instanceof ESType || secondary instanceof ESSymbol)
        return primary === secondary.str().valueOf();

    if (typeof primary !== 'object' || typeof secondary !== 'object')
        return false;

    for (let key in primary) {
        if (!secondary.hasOwnProperty(key))
            return false;

        const pValue = primary[key];
        const sValue = secondary[key];

        if (Array.isArray(pValue))
            return arraysSame(pValue, sValue);
        if (typeof pValue === 'object' || typeof sValue === 'object')
            return objectsSame(pValue, sValue) || objectsSame(sValue, pValue);

        if (pValue !== sValue)
            return false;
    }
    return true;
}

/**
 * @param {any[]} arr1
 * @param {any[]} arr2
 * @returns {boolean}
 */
function arraysSame (arr1, arr2) {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
    if (arr1.length !== arr2.length) return false;

    for (let i = 0; i < arr1.length; i++) {
        if (Array.isArray(arr1[i]) || Array.isArray(arr2[i]))
            return arraysSame(arr1[i], arr2[i])

        if (arr2[i] instanceof ESFunction || arr2[i] instanceof ESType)
            return arr1[i] === arr2[i].str().valueOf();
        if (arr1[i] instanceof ESFunction || arr1[i] instanceof ESType)
            return arr2[i] === arr1[i].str().valueOf();

        if (typeof arr1[i] === 'object' || typeof arr2[i] === 'object')
            return objectsSame(arr1[i], arr2[i]) || objectsSame(arr2[i], arr1[i]);

        if (arr1[i] !== arr2[i])
            return false;
    }
    return true;
}

/**
 * @param {any[] | string}expected
 * @param {string} from
 */
export function expect(expected, from) {
    Test.test(env => {
        /** @type {interpretResult | ({ timeData: timeData; } & interpretResult)} */
        let result;
        try {
            result = run(from, {
                env,
                fileName: 'TEST_ENV'
            });
        } catch (e) {
            return new TestFailed(`Tried to run, but got error: ${e}. With code: ${from}`);
        }

        let resVal = result.val?.valueOf();

        if (result.error && Array.isArray(expected))
            return new TestFailed(
            `Unexpected error encountered when running test. Expected '${expected}' but got error:
${result.error.str}
with code
'${from}'\n`
        );

        function test () {
            if (result.error || typeof expected === 'string') {
                if (!result.error) return false;
                if (Array.isArray(expected)) return false;

                return (result?.error?.constructor?.name ?? 'Error') === expected;
            }

            if (!arraysSame(expected, ESPrimitive.strip(result.val)))
                console.log('%%', expected, str(ESPrimitive.strip(result.val)), '@@');

            return arraysSame(expected, ESPrimitive.strip(result.val));
        }

        const res = test();
        if (res) return true;

        const val = result.error || resVal;

        return new TestFailed(
            `Expected \n'${str(expected)}' \n but got \n'${str(val)}'\n instead from test with code \n'${from}'\n`
        );

    });
}