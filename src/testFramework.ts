import {ESError, TestFailed} from "./errors.js";
import {run} from "./index.js";
import {Context} from "./context.js";
import {global, now} from "./constants.js";
import {str} from "./util.js";

export class TestResult {

    failed: number;
    passed: number;

    fails: ESError[];

    time = 0;

    constructor () {
        this.failed = 0;
        this.passed = 0;
        this.fails = [];
    }

    register (res: TestResult | boolean | ESError) {
        if (typeof res === 'boolean') {
            if (res)
                this.passed++;
            else
                this.failed++;
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
                ${this.failed} tests failed
                ${this.passed} tests passed
                
            In ${this.time}ms
            
            ${this.failed === 0? 'All tests passed!' : ''}
            
            ${this.fails.map(error => `\n-----------------\n${error.str}\n`)}
        `;
    }
}

export class Test {
    test: (env: Context) => boolean | ESError;
    id: string | number;

    constructor (test: (env: Context) => boolean | ESError, id: string | number = 'test') {
        this.id = id;
        this.test = test;
    }

    run (env: Context) {
        return this.test(env);
    }

    static tests: Test[] = [];

    static test (test: (env: Context) => boolean | ESError) {
        Test.tests.push(new Test(test, Test.tests.length));
    }

    static testAll (): TestResult {
        const res = new TestResult();

        let time = now();

        for (let test of Test.tests) {
            global.resetAsGlobal();
            const testEnv = new Context();
            testEnv.parent = global;
            res.register(test.run(testEnv));
        }

        res.time = Math.round( now() - time);

        return res;
    }
}

function arraysSame (arr1: any[], arr2: any[]): boolean {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
    if (arr1.length !== arr2.length) return false;

    for (let i = 0; i < arr1.length; i++) {
        if (Array.isArray(arr1[i])) {

            if (!Array.isArray(arr1[i]))
                return false;

            return arraysSame(arr1[i], arr2[i])
        }

        if (arr1[i] !== arr2[i])
            return false;
    }
    return true;
}

export function expect (expected: any[] | string, from: string) {
    Test.test(env => {
        let result = run(from, {
            env
        });

        if (result.error && Array.isArray(expected)) return new TestFailed(
            `Unexpected error encountered when running test. Expected '${expected}' but got error: 
${result.error.str}
with code 
'${from}'\n`
        );
        if (Array.isArray(result.val))
            for (let i = 0; i < result.val.length; i++) {
                if (typeof result.val[i] === 'object' && !Array.isArray(result.val[i]))
                    result.val[i] = result.val[i]?.constructor?.name || 'Object';
            }

        function test () {
            if (result.error || typeof expected === 'string') {
                if (!result.error) return false;
                if (Array.isArray(expected)) return false;

                return (result?.error?.constructor?.name ?? 'Error') === expected;
            }
            return arraysSame(expected, result.val);
        }

        const res = test();
        if (res) return true;

        const val = result.error || result.val;

        return new TestFailed(
            `Expected \n'${str(expected)}' \n but got \n'${str(val)}'\n instead from test with code \n'${from}'\n`
        );

    });
}