import {ESError, TestFailed} from "./errors.js";
import {run} from "./index.js";
import {Context, ESSymbol} from "./context.js";
import {global, now} from "./constants.js";
import {str, timeData } from "./util.js";
import { ESFunction, ESPrimitive, ESType } from "./primitiveTypes.js";
import { interpretResult } from "./nodes.js";

export class TestResult {

    failed: number;
    passed: number;

    fails: ESError[];

    time = 0;

    constructor() {
        this.failed = 0;
        this.passed = 0;
        this.fails = [];
    }

    register(res: TestResult | boolean | ESError) {
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

    str() {
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
    test: (env: Context) => boolean | ESError;
    id: string | number;

    constructor(test: (env: Context) => boolean | ESError, id: string | number = 'test') {
        this.id = id;
        this.test = test;
    }

    run(env: Context): boolean | ESError {
        return this.test(env);
    }

    static tests: Test[] = [];

    static test(test: (env: Context) => boolean | ESError) {
        Test.tests.push(new Test(test, Test.tests.length));
    }

    static testAll(): TestResult {
        const res = new TestResult();

        let time = now();

        for (let test of Test.tests) {
            global.resetAsGlobal();
            const testEnv = new Context();
            testEnv.parent = global;
            res.register(test.run(testEnv));
        }

        res.time = Math.round(now() - time);

        return res;
    }
}

function objectsSame(primary: any, secondary: any): boolean {
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

function arraysSame(arr1: any[], arr2: any[]): boolean {
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

export function expect(expected: any[] | string, from: string) {
    Test.test(env => {
        let result: interpretResult | ({ timeData: timeData; } & interpretResult);
        try {
            result = run(from, {
                env
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