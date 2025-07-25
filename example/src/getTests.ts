import {
  type TestObjectCpp,
  type TestObjectSwiftKotlin,
  OldEnum,
  type Car,
  type Person,
  type Powertrain,
  WeirdNumbersEnum,
} from 'react-native-nitro-test'
import type { State } from './Testers'
import { it } from './Testers'
import { stringify } from './utils'
import {
  getHybridObjectConstructor,
  NitroModules,
} from 'react-native-nitro-modules'
import { InteractionManager } from 'react-native'

type TestResult =
  | {
      status: 'successful'
      result: string
    }
  | {
      status: 'failed'
      message: string
    }

export interface TestRunner {
  name: string
  run: () => Promise<TestResult>
}

const TEST_PERSON: Person = {
  age: 24,
  name: 'Marc',
}
const TEST_CAR: Car = {
  year: 2018,
  make: 'Lamborghini',
  model: 'Huracan Performante',
  power: 640,
  powertrain: 'gas',
  driver: undefined, // <-- value needs to be explicitly set, to equal it with native's std::optional<..>
  isFast: true,
}
const TEST_MAP: Record<string, number | boolean> = {
  someKey: 55,
  some_other_key: 123,
  a_bool: true,
  another_bool: false,
}
const TEST_MAP_2: Record<string, string> = {
  'someKey': 'someValue',
  'anotherKey': 'another-value',
  'third-key': 'thirdValue',
}

const BASE_DATE = new Date()
const DATE_PLUS_1H = (() => {
  const current = BASE_DATE.getTime()
  const oneHourInMilliseconds = 1000 * 60 * 60
  return new Date(current + oneHourInMilliseconds)
})()

function createTest<T>(
  name: string,
  run: () => State<T> | Promise<State<T>>
): TestRunner {
  return {
    name: name,
    run: async (): Promise<TestResult> => {
      try {
        console.log(`⏳ Test "${name}" started...`)
        const state = await run()
        console.log(`✅ Test "${name}" passed!`)
        return {
          status: 'successful',
          result: stringify(state.result ?? state.errorThrown ?? '(void)'),
        }
      } catch (e) {
        console.log(`❌ Test "${name}" failed! ${e}`)
        return {
          status: 'failed',
          message: stringify(e),
        }
      }
    },
  }
}

function timeoutedPromise<T>(
  run: (complete: (value: T) => void) => void | Promise<void>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    let didResolve = false
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        setImmediate(() => {
          setTimeout(() => {
            if (!didResolve) reject(new Error(`Timeouted!`))
          }, 1500)
        })
      })
    })
    try {
      await run((value) => {
        if (didResolve) {
          throw new Error(`Promise was already rejected!`)
        }
        didResolve = true
        resolve(value)
      })
    } catch (e) {
      didResolve = true
      reject(e)
    }
  })
}

export function getTests(
  testObject: TestObjectCpp | TestObjectSwiftKotlin
): TestRunner[] {
  return [
    // Basic prototype tests
    createTest('HybridObject.prototype is valid', () =>
      it(() => Object.getPrototypeOf(testObject))
        .didNotThrow()
        .didReturn('object')
        .toContain('simpleFunc')
    ),
    createTest('HybridObject.prototype.prototype is valid', () =>
      it(() => Object.getPrototypeOf(Object.getPrototypeOf(testObject)))
        .didNotThrow()
        .didReturn('object')
        .toContain('toString')
        .toContain('equals')
    ),
    createTest('Two HybridObjects are not equal (a == b)', () =>
      it(
        () =>
          // eslint-disable-next-line no-self-compare
          testObject.newTestObject() === testObject.newTestObject()
      )
        .didNotThrow()
        .equals(false)
    ),
    createTest('Two HybridObjects are not equal (a.equals(b))', () =>
      it(() => testObject.newTestObject().equals(testObject.newTestObject()))
        .didNotThrow()
        .equals(false)
    ),
    createTest("Two HybridObjects's prototypes are equal", () =>
      it(() => {
        const objA = testObject.newTestObject()
        const objB = testObject.newTestObject()
        return Object.getPrototypeOf(objA) === Object.getPrototypeOf(objB)
      })
        .didNotThrow()
        .equals(true)
    ),

    // Test Primitives (getters & setters)
    createTest('set numberValue to 13', () =>
      it(() => (testObject.numberValue = 13)).didNotThrow()
    ),
    createTest('get numberValue (== 13)', () =>
      it(() => {
        testObject.numberValue = 14
        return testObject.numberValue
      })
        .didNotThrow()
        .equals(14)
    ),
    createTest('set boolValue to true', () =>
      it(() => (testObject.boolValue = true)).didNotThrow()
    ),
    createTest('get boolValue (== true)', () =>
      it(() => {
        testObject.boolValue = true
        return testObject.boolValue
      })
        .didNotThrow()
        .equals(true)
    ),
    createTest("set stringValue to 'hello!'", () =>
      it(() => (testObject.stringValue = 'hello!')).didNotThrow()
    ),
    createTest("get stringValue (== 'hello!')", () =>
      it(() => {
        testObject.stringValue = 'hello!'
        return testObject.stringValue
      })
        .didNotThrow()
        .equals('hello!')
    ),
    createTest('set bigintValue to 7362572367826385n', () =>
      it(() => (testObject.bigintValue = 7362572367826385n)).didNotThrow()
    ),
    createTest('get bigintValue (== 7362572367826385n)', () =>
      it(() => {
        testObject.bigintValue = 7362572367826385n
        return testObject.bigintValue
      })
        .didNotThrow()
        .equals(7362572367826385n)
    ),
    createTest('set stringOrUndefined to string, then undefined', () =>
      it(() => {
        testObject.stringOrUndefined = 'hello'
        testObject.stringOrUndefined = undefined
      }).didNotThrow()
    ),
    createTest('get stringOrUndefined (== undefined)', () =>
      it(() => {
        testObject.stringOrUndefined = undefined
        return testObject.stringOrUndefined
      })
        .didNotThrow()
        .equals(undefined)
    ),
    createTest('set stringOrNull to string, then undefined', () =>
      it(() => {
        testObject.stringOrNull = 'hello'
        testObject.stringOrNull = null
      }).didNotThrow()
    ),
    createTest('get stringOrNull (== undefined)', () =>
      it(() => {
        testObject.stringOrNull = null
        return testObject.stringOrNull
      })
        .didNotThrow()
        .equals(null)
    ),
    createTest('set optionalString to string, then undefined', () =>
      it(() => {
        testObject.optionalString = 'hello'
        testObject.optionalString = undefined
      }).didNotThrow()
    ),
    createTest('get optionalString (== undefined)', () =>
      it(() => {
        testObject.optionalString = undefined
        return testObject.optionalString
      })
        .didNotThrow()
        .equals(undefined)
    ),
    createTest('get optionalArray (== undefined)', () =>
      it(() => {
        testObject.optionalArray = undefined
        return testObject.optionalArray
      })
        .didNotThrow()
        .equals(undefined)
    ),
    createTest('get optionalArray (== ["hello", "world"])', () =>
      it(() => {
        testObject.optionalArray = ['hello', 'world']
        return testObject.optionalArray
      })
        .didNotThrow()
        .equals(['hello', 'world'])
    ),
    createTest('get optionalHybrid (== undefined)', () =>
      it(() => {
        testObject.optionalHybrid = undefined
        return testObject.optionalHybrid
      })
        .didNotThrow()
        .didReturn('undefined')
    ),
    createTest('get optionalHybrid (== self)', () =>
      it(() => {
        testObject.optionalHybrid = testObject
        return testObject.optionalHybrid
      })
        .didNotThrow()
        .didReturn('object')
        // @ts-expect-error
        .equals(testObject.optionalHybrid)
        .cleanup(() => {
          testObject.optionalHybrid = undefined
        })
    ),
    createTest('get optionalEnum (== undefined)', () =>
      it(() => {
        testObject.optionalEnum = undefined
        return testObject.optionalEnum
      })
        .didNotThrow()
        .didReturn('undefined')
    ),
    createTest('get optionalEnum (== self)', () =>
      it(() => {
        testObject.optionalEnum = 'gas'
        return testObject.optionalEnum
      })
        .didNotThrow()
        .didReturn('string')
        .equals('gas')
    ),
    createTest('get optionalOldEnum (== undefined)', () =>
      it(() => {
        testObject.optionalOldEnum = undefined
        return testObject.optionalOldEnum
      })
        .didNotThrow()
        .didReturn('undefined')
    ),
    createTest('get optionalOldEnum (== self)', () =>
      it(() => {
        testObject.optionalOldEnum = OldEnum.SECOND
        return testObject.optionalOldEnum
      })
        .didNotThrow()
        .didReturn(typeof OldEnum.SECOND)
        .equals(OldEnum.SECOND)
    ),
    createTest('set optionalCallback, then undefined', () =>
      it(() => {
        testObject.optionalCallback = () => {}
        testObject.optionalCallback = undefined
      }).didNotThrow()
    ),
    createTest('get optionalCallback (== self)', () =>
      it(() => {
        testObject.optionalCallback = () => {}
        return testObject.optionalCallback
      })
        .didNotThrow()
        .didReturn('function')
    ),

    // Test basic functions
    createTest('addNumbers(5, 13) = 18', () =>
      it(() => testObject.addNumbers(5, 13))
        .didNotThrow()
        .equals(18)
    ),
    createTest('addStrings("hello ", "world") = "hello world"', () =>
      it(() => testObject.addStrings('hello ', 'world'))
        .didNotThrow()
        .equals('hello world')
    ),
    createTest('simpleFunc()', () =>
      it(() => testObject.simpleFunc())
        .didNotThrow()
        .didReturn('undefined')
    ),
    createTest('multipleArguments(...)', () =>
      it(() => testObject.multipleArguments(13, 'hello!', true))
        .didNotThrow()
        .didReturn('undefined')
    ),

    // Arrays
    createTest('bounceNumbers(...) equals', () =>
      it(() => testObject.bounceNumbers([1, 2, 13, 42]))
        .didNotThrow()
        .didReturn('object')
        .equals([1, 2, 13, 42])
    ),
    createTest('bounceStrings(...) equals', () =>
      it(() => testObject.bounceStrings(['hello', 'world', '!']))
        .didNotThrow()
        .didReturn('object')
        .equals(['hello', 'world', '!'])
    ),
    createTest('bounceEnums(...) equals', () =>
      it(() => testObject.bounceEnums(['gas', 'hybrid']))
        .didNotThrow()
        .didReturn('object')
        .equals(['gas', 'hybrid'])
    ),
    createTest('bounceStructs(...) equals', () =>
      it(() =>
        testObject.bounceStructs([
          { age: 24, name: 'Marc' },
          { age: 5, name: 'Ben' },
        ])
      )
        .didNotThrow()
        .didReturn('object')
        .equals([
          { age: 24, name: 'Marc' },
          { age: 5, name: 'Ben' },
        ])
    ),

    createTest('complexEnumCallback(...)', async () =>
      (
        await it<Powertrain[]>(async () => {
          return timeoutedPromise((complete) => {
            testObject.complexEnumCallback(['gas', 'electric'], (result) => {
              complete(result)
            })
          })
        })
      )
        .didNotThrow()
        .equals(['gas', 'electric'])
    ),

    // Test Dates
    createTest('currentDate(...) is a Date', () =>
      it(() => {
        const now = testObject.currentDate()
        return now instanceof Date
      })
        .didNotThrow()
        .equals(true)
    ),
    createTest('add1Hour(...)', () =>
      it(() => {
        const added = testObject.add1Hour(BASE_DATE)
        return added.getTime()
      })
        .didNotThrow()
        .equals(DATE_PLUS_1H.getTime())
    ),
    createTest('currentDate(...) is roughly same JS value', () =>
      it(() => {
        const nativeNow = testObject.currentDate()
        const jsNow = new Date()
        const msDiff = Math.abs(jsNow.getTime() - nativeNow.getTime())
        return msDiff < 10
      })
        .didNotThrow()
        .equals(true)
    ),

    // Test Maps
    createTest('createMap()', () =>
      it(() => testObject.createMap())
        .didNotThrow()
        .didReturn('object')
        .toContain('object')
        .toContain('array')
        .toContain('null')
        .toContain('bigint')
        .toContain('string')
        .toContain('bool')
        .toContain('number')
    ),
    createTest('createMap().array', () =>
      it(() => testObject.createMap().array)
        .didNotThrow()
        .didReturn('object')
        .equals([
          testObject.numberValue,
          testObject.boolValue,
          testObject.stringValue,
          testObject.bigintValue,
        ])
    ),
    createTest('createMap().object', () =>
      it(() => testObject.createMap().object)
        .didNotThrow()
        .didReturn('object')
        .equals({
          array: [
            testObject.numberValue,
            testObject.boolValue,
            testObject.stringValue,
            testObject.bigintValue,
            [
              testObject.numberValue,
              testObject.boolValue,
              testObject.stringValue,
              testObject.bigintValue,
            ],
          ],
          bigint: testObject.bigintValue,
          bool: testObject.boolValue,
          string: testObject.stringValue,
          number: testObject.numberValue,
          null: null,
        })
    ),
    createTest('mapRoundtrip(...) works', () => {
      const map = testObject.createMap()
      return it(() => testObject.mapRoundtrip(map))
        .didNotThrow()
        .equals(map)
    }),
    createTest('getMapKeys(...) works', () => {
      const map = testObject.createMap()
      const targetKeys = [...Object.keys(map)].sort()
      return it(() => {
        const keys = testObject.getMapKeys(map)
        return [...keys].sort()
      })
        .didNotThrow()
        .equals(targetKeys)
    }),

    // Test errors
    createTest('funcThatThrows() throws', () =>
      it(() => testObject.funcThatThrows())
        // contains the method name:
        .didThrow(`${testObject.name}.funcThatThrows(...):`)
        // contains the error message:
        .didThrow(`This function will only work after sacrificing seven lambs!`)
    ),
    createTest('funcThatThrowsBeforePromise() throws', async () =>
      (await it(async () => await testObject.funcThatThrowsBeforePromise()))
        // contains the method name:
        .didThrow(`${testObject.name}.funcThatThrowsBeforePromise(...):`)
        // contains the error message:
        .didThrow(`This function will only work after sacrificing eight lambs!`)
    ),
    createTest('throwError(error) throws same message from JS', () =>
      it(() => {
        const error = new Error('rethrowing a JS error from native!')
        testObject.throwError(error)
      })
        // contains the method name:
        .didThrow(`${testObject.name}.throwError(...):`)
        // contains the error message:
        .didThrow(`Error: rethrowing a JS error from native!`)
    ),

    // Optional parameters
    createTest('tryOptionalParams(...) omitted', () =>
      it(() => testObject.tryOptionalParams(13, true))
        .didNotThrow()
        .didReturn('string')
        .equals('value omitted!')
    ),
    createTest('tryOptionalParams(...) provided', () =>
      it(() => testObject.tryOptionalParams(13, true, 'hello'))
        .didNotThrow()
        .didReturn('string')
        .equals('hello')
    ),
    createTest('tryOptionalParams(...) one-too-many', () =>
      it(() =>
        testObject.tryOptionalParams(
          13,
          true,
          'hello',
          // @ts-expect-error
          'too many args!'
        )
      )
        // thrown by HybridFunction, not by the user;
        .didThrow(
          `Error: \`${testObject.name}.tryOptionalParams(...)\` expected between 2 and 3 arguments, but received 4!`
        )
    ),
    createTest('tryOptionalParams(...) one-too-few', () =>
      it(() =>
        // @ts-expect-error
        testObject.tryOptionalParams(13)
      )
        // thrown by HybridFunction, not by the user;
        .didThrow(
          `Error: \`${testObject.name}.tryOptionalParams(...)\` expected between 2 and 3 arguments, but received 1!`
        )
    ),
    createTest('tryMiddleParam(...)', () =>
      it(() => testObject.tryMiddleParam(13, undefined, 'hello!'))
        .didNotThrow()
        .equals('hello!')
    ),
    createTest('tryMiddleParam(...)', () =>
      it(() => testObject.tryMiddleParam(13, true, 'passed'))
        .didNotThrow()
        .equals('passed')
    ),
    createTest('tryOptionalEnum(...)', () =>
      it(() => testObject.tryOptionalEnum('gas'))
        .didNotThrow()
        .equals('gas')
    ),
    createTest('tryOptionalEnum(...)', () =>
      it(() => testObject.tryOptionalEnum(undefined))
        .didNotThrow()
        .equals(undefined)
    ),

    // Variants tests
    createTest('set someVariant to 55', () =>
      it(() => (testObject.someVariant = 55)).didNotThrow()
    ),
    createTest('get someVariant (== 55)', () =>
      it(() => {
        testObject.someVariant = 55
        return testObject.someVariant
      }).equals(55)
    ),
    createTest("set someVariant to 'some-string'", () =>
      it(() => (testObject.someVariant = 'some-string')).didNotThrow()
    ),
    createTest("get someVariant (== 'some-string')", () =>
      it(() => {
        testObject.someVariant = 'some-string'
        return testObject.someVariant
      }).equals('some-string')
    ),
    createTest('set someVariant to false', () =>
      it(
        () =>
          // @ts-expect-error
          (testObject.someVariant = false)
      ).didThrow(
        `Error: ${testObject.name}.someVariant: Cannot convert "false" to any type in variant<std::string, double>!`
      )
    ),

    createTest('passVariant(...) holds something else ([1,2,3])', () =>
      it(() => testObject.passVariant([1, 2, 3]))
        .didNotThrow()
        .equals('holds something else!')
    ),
    createTest('passVariant(...) holds string(hello!)', () =>
      it(() => testObject.passVariant('hello!'))
        .didNotThrow()
        .equals('hello!')
    ),
    createTest('passVariant(...) holds number (5)', () =>
      it(() => testObject.passVariant(5))
        .didNotThrow()
        .equals(5)
    ),
    createTest('passVariant(...) wrong type ({})', () =>
      it(() =>
        testObject.passVariant(
          // @ts-expect-error
          {}
        )
      ).didThrow()
    ),
    // Complex variants tests
    createTest('getVariantEnum(...) converts enum', () =>
      it(() => testObject.getVariantEnum(OldEnum.THIRD))
        .didNotThrow()
        .equals(OldEnum.THIRD)
    ),
    createTest('getVariantEnum(...) converts boolean', () =>
      it(() => testObject.getVariantEnum(true))
        .didNotThrow()
        .equals(true)
    ),
    createTest('getVariantEnum(...) throws at wrong type (string)', () =>
      // @ts-expect-error
      it(() => testObject.getVariantEnum('string')).didThrow(
        `Error: ${testObject.name}.getVariantEnum(...): Cannot convert "string" to any type in variant<bool, margelo::nitro::test::OldEnum>!`
      )
    ),
    createTest('getVariantEnum(...) throws at too high numerical value', () =>
      // @ts-expect-error
      it(() => testObject.getVariantEnum(9999)).didThrow(
        `Error: ${testObject.name}.getVariantEnum(...): Cannot convert "9999" to any type in variant<bool, margelo::nitro::test::OldEnum>!`
      )
    ),
    createTest('getVariantWeirdNumbersEnum(...) converts enum', () =>
      it(() => testObject.getVariantWeirdNumbersEnum(WeirdNumbersEnum.C))
        .didNotThrow()
        .equals(WeirdNumbersEnum.C)
    ),
    createTest('getVariantWeirdNumbersEnum(...) converts boolean', () =>
      it(() => testObject.getVariantWeirdNumbersEnum(true))
        .didNotThrow()
        .equals(true)
    ),
    createTest(
      'getVariantWeirdNumbersEnum(...) throws at wrong type (string)',
      () =>
        // @ts-expect-error
        it(() => testObject.getVariantWeirdNumbersEnum('string')).didThrow(
          `Error: ${testObject.name}.getVariantWeirdNumbersEnum(...): Cannot convert "string" to any type in variant<bool, margelo::nitro::test::WeirdNumbersEnum>!`
        )
    ),
    createTest(
      'getVariantWeirdNumbersEnum(...) throws at too high numerical value',
      () =>
        // @ts-expect-error
        it(() => testObject.getVariantWeirdNumbersEnum(99999)).didThrow(
          `Error: ${testObject.name}.getVariantWeirdNumbersEnum(...): Cannot convert "99999" to any type in variant<bool, margelo::nitro::test::WeirdNumbersEnum>!`
        )
    ),
    createTest('getVariantObjects(...) converts Person', () =>
      it(() => testObject.getVariantObjects(TEST_PERSON))
        .didNotThrow()
        .equals(TEST_PERSON)
    ),
    createTest('getVariantObjects(...) converts Car', () =>
      it(() => testObject.getVariantObjects(TEST_CAR))
        .didNotThrow()
        .equals(TEST_CAR)
    ),
    createTest('getVariantObjects(...) converts Car (+ person)', () =>
      it(() =>
        testObject.getVariantObjects({ ...TEST_CAR, driver: TEST_PERSON })
      )
        .didNotThrow()
        .equals({ ...TEST_CAR, driver: TEST_PERSON })
    ),
    createTest('getVariantObjects(...) throws at wrong type (string)', () =>
      // @ts-expect-error
      it(() => testObject.getVariantObjects('some-string')).didThrow(
        `Error: ${testObject.name}.getVariantObjects(...): Cannot convert "some-string" to any type in variant<margelo::nitro::test::Car, margelo::nitro::test::Person>!`
      )
    ),
    createTest(
      'getVariantObjects(...) throws at wrong type (wrong object)',
      () =>
        it(() =>
          // @ts-expect-error
          testObject.getVariantObjects({ someValue: 55 })
        ).didThrow(
          `Error: ${testObject.name}.getVariantObjects(...): Cannot convert "[object Object]" to any type in variant<margelo::nitro::test::Car, margelo::nitro::test::Person>!`
        )
    ),
    createTest('getVariantHybrid(...) converts Hybrid', () =>
      // @ts-expect-error TypeScript spazzes out since it can be both types of HybridObject
      it(() => testObject.getVariantHybrid(testObject))
        .didNotThrow()
        // @ts-expect-error
        .toContain('getVariantHybrid')
    ),
    createTest('getVariantHybrid(...) converts Person', () =>
      it(() => testObject.getVariantHybrid(TEST_PERSON))
        .didNotThrow()
        .equals(TEST_PERSON)
    ),
    createTest('getVariantHybrid(...) throws at wrong type (string)', () =>
      // @ts-expect-error
      it(() => testObject.getVariantHybrid('some-string')).didThrow()
    ),
    createTest(
      'getVariantHybrid(...) throws at wrong type (wrong object)',
      () =>
        it(() =>
          // @ts-expect-error
          testObject.getVariantHybrid({ someValue: 55 })
        ).didThrow()
    ),
    createTest('passNamedVariant(...) works', () =>
      it(() => testObject.passNamedVariant('Hello world!'))
        .didNotThrow()
        .equals('Hello world!')
    ),

    // More complex variants...
    ...('getVariantTuple' in testObject
      ? [
          createTest('getVariantTuple(...) converts Float2', () =>
            it(() => testObject.getVariantTuple([10, 20]))
              .didNotThrow()
              .equals([10, 20])
          ),
          createTest('getVariantTuple(...) converts Float3', () =>
            it(() => testObject.getVariantTuple([10, 20, 30]))
              .didNotThrow()
              .equals([10, 20, 30])
          ),
          createTest(
            'getVariantTuple(...) throws at wrong size (4 items)',
            () =>
              it(() =>
                // @ts-expect-error
                testObject.getVariantTuple([10, 20, 30, 40, 50])
              ).didThrow()
          ),
          createTest('getVariantTuple(...) throws at wrong type (string)', () =>
            // @ts-expect-error
            it(() => testObject.getVariantTuple('hello')).didThrow()
          ),
          createTest(
            'getVariantTuple(...) throws at wrong type (string[])',
            () =>
              it(() =>
                // @ts-expect-error
                testObject.getVariantTuple(['hello', 'world'])
              ).didThrow()
          ),
        ]
      : [
          // Swift/Kotlin test object does not have variants yet.
        ]),

    // Tuples Tests
    ...('someTuple' in testObject
      ? [
          createTest("set someTuple to [55, 'hello']", () =>
            it(() => (testObject.someTuple = [55, 'hello'])).didNotThrow()
          ),
          createTest("get someTuple (== [55, 'hello'])", () =>
            it(() => {
              testObject.someTuple = [55, 'hello']
              return testObject.someTuple
            }).equals([55, 'hello'])
          ),
          createTest('flip([10, 20, 30])', () =>
            it(() => testObject.flip([10, 20, 30]))
              .didNotThrow()
              .equals([30, 20, 10])
          ),
          createTest('flip([10, 20]) throws', () =>
            it(() =>
              testObject.flip(
                // @ts-expect-error
                [10, 20]
              )
            ).didThrow(
              `Error: ${testObject.name}.flip(...): The given JS Array has 2 items, but std::tuple<double, double, double> expects 3 items.`
            )
          ),
          createTest('passTuple(...)', () =>
            it(() => testObject.passTuple([13, 'hello', true]))
              .didNotThrow()
              .equals([13, 'hello', true])
          ),
        ]
      : [
          // Swift/Kotlin Test Object does not have tuples yet!
        ]),

    createTest('bounceMap(map) === map', () =>
      it(() => testObject.bounceMap(TEST_MAP))
        .didNotThrow()
        .didReturn('object')
        .equals(TEST_MAP)
    ),
    createTest('extractMap(mapWrapper) === mapWrapper.map', () =>
      it(() => testObject.extractMap({ map: TEST_MAP_2 }))
        .didNotThrow()
        .didReturn('object')
        .equals(TEST_MAP_2)
    ),

    // Promises
    createTest('wait', async () =>
      (await it(() => testObject.wait(0.1))).didNotThrow()
    ),
    createTest('calculateFibonacciSync(5)', async () =>
      it(() => testObject.calculateFibonacciSync(10))
        .didNotThrow()
        .equals(55n)
    ),
    createTest('calculateFibonacciAsync(5)', async () =>
      (await it(() => testObject.calculateFibonacciAsync(10)))
        .didNotThrow()
        .equals(55n)
    ),
    createTest('promiseThrows() throws', async () =>
      (await it(() => testObject.promiseThrows())).didThrow(
        'Error: Promise throws :)'
      )
    ),
    createTest('twoPromises can run in parallel', async () =>
      (
        await it(async () => {
          const start = performance.now()
          // 0.5s + 0.5s = ~1s in serial, ~0.5s in parallel
          await Promise.all([testObject.wait(0.5), testObject.wait(0.5)])
          const end = performance.now()
          const didRunInParallel = end - start < 1000
          return didRunInParallel
        })
      )
        .didNotThrow()
        .equals(true)
    ),
    createTest('JS Promise<number> can be awaited on native side', async () =>
      (
        await it(() => {
          return timeoutedPromise(async (complete) => {
            let resolve = (_: number) => {}
            const promise = new Promise<number>((r) => {
              resolve = r
            })
            const nativePromise = testObject.awaitAndGetPromise(promise)
            resolve(5)
            const result = await nativePromise
            complete(result)
          })
        })
      )
        .didNotThrow()
        .equals(5)
    ),
    createTest('JS Promise<Car> can be awaited on native side', async () =>
      (
        await it(() => {
          return timeoutedPromise(async (complete) => {
            let resolve = (_: Car) => {}
            const promise = new Promise<Car>((r) => {
              resolve = r
            })
            const nativePromise = testObject.awaitAndGetComplexPromise(promise)
            resolve(TEST_CAR)
            const result = await nativePromise
            complete(result)
          })
        })
      )
        .didNotThrow()
        .equals(TEST_CAR)
    ),
    createTest('JS Promise<void> can be awaited on native side', async () =>
      (
        await it(() => {
          return timeoutedPromise(async (complete) => {
            let resolve = () => {}
            const promise = new Promise<void>((r) => {
              resolve = r
            })
            const nativePromise = testObject.awaitPromise(promise)
            resolve()
            const result = await nativePromise
            complete(result)
          })
        })
      )
        .didNotThrow()
        .equals(undefined)
    ),
    createTest(
      'JS Promise<void> that rejects will also reject on native',
      async () =>
        (
          await it(() => {
            return timeoutedPromise(async () => {
              let reject = (_: Error) => {}
              const promise = new Promise<void>((_, r) => {
                reject = r
              })
              const nativePromise = testObject.awaitPromise(promise)
              reject(new Error(`rejected from JS!`))
              await nativePromise
            })
          })
        ).didThrow()
    ),

    // Callbacks
    createTest('callCallback(...)', async () =>
      (
        await it<boolean>(async () => {
          return timeoutedPromise((complete) => {
            testObject.callCallback(() => {
              complete(true)
            })
          })
        })
      )
        .didNotThrow()
        .equals(true)
    ),
    createTest('callWithOptional(undefined)', async () =>
      (
        await it<number | undefined>(async () => {
          return timeoutedPromise((complete) => {
            testObject.callWithOptional(undefined, (val) => {
              complete(val)
            })
          })
        })
      )
        .didNotThrow()
        .equals(undefined)
    ),
    createTest('callWithOptional(433)', async () =>
      (
        await it<number | undefined>(async () => {
          return timeoutedPromise((complete) => {
            testObject.callWithOptional(433, (val) => {
              complete(val)
            })
          })
        })
      )
        .didNotThrow()
        .equals(433)
    ),
    createTest('getValueFromJsCallback(...)', async () =>
      (
        await it(async () => {
          let value: string | undefined
          await testObject.getValueFromJsCallback(
            () => 'hello',
            (val) => {
              value = val
            }
          )
          return value
        })
      )
        .didNotThrow()
        .equals('hello')
    ),
    createTest(
      'Single callback can be called and awaited: getValueFromJSCallbackAndWait(...)',
      async () =>
        (await it(() => testObject.getValueFromJSCallbackAndWait(() => 73)))
          .didNotThrow()
          .equals(73)
    ),
    createTest('Multiple callbacks are all called: callAll(...)', async () =>
      (
        await it(async () => {
          return timeoutedPromise((complete) => {
            let calledCount = 0
            const func = () => {
              calledCount++
              if (calledCount === 3) complete(calledCount)
            }
            testObject.callAll(func, func, func)
          })
        })
      )
        .didNotThrow()
        .equals(3)
    ),
    createTest(
      'Callback can be called multiple times: callSumUpNTimes(...)',
      async () =>
        (await it(async () => await testObject.callSumUpNTimes(() => 7, 5)))
          .didNotThrow()
          .equals(7 * 5 /* = 35 */)
    ),
    createTest(
      'Async callback can be awaited and returned on native side: callbackAsyncPromise(...)',
      async () =>
        (
          await it(async () => {
            return timeoutedPromise(async (complete) => {
              const result = await testObject.callbackAsyncPromise(async () => {
                return 13
              })
              complete(result)
            })
          })
        )
          .didNotThrow()
          .equals(13)
    ),
    createTest(
      'Async callback can be awaited and returned on native side: callbackAsyncPromiseBuffer(...)',
      async () =>
        (
          await it(async () => {
            return timeoutedPromise<ArrayBuffer>(async (complete) => {
              const result = await testObject.callbackAsyncPromiseBuffer(
                async () => {
                  return await testObject.createArrayBufferAsync()
                }
              )
              complete(result)
            })
          })
        )
          .didNotThrow()
          .didReturn('object')
          .toContain('byteLength')
    ),
    createTest(
      'Async callback that throws in JS will rethrow in native',
      async () =>
        (
          await it(async () => {
            return timeoutedPromise<ArrayBuffer>(async () => {
              await testObject.callbackAsyncPromise(() => {
                throw new Error(`throwing in JS!`)
              })
            })
          })
        ).didThrow()
    ),
    createTest('Getting complex callback from native returns a function', () =>
      it(() => testObject.getComplexCallback())
        .didNotThrow()
        .didReturn('function')
    ),

    // Objects
    createTest('getCar()', () =>
      it(() => testObject.getCar())
        .didNotThrow()
        .didReturn('object')
        .toContain('year')
        .toContain('make')
        .toContain('model')
        .toContain('power')
        .toContain('powertrain')
        .toContain('driver')
    ),
    createTest('isCarElectric(...)', () =>
      it(() =>
        testObject.isCarElectric({
          make: 'Lamborghini',
          year: 2018,
          model: 'Huracan Performante',
          power: 640,
          powertrain: 'gas',
          isFast: true,
        })
      )
        .didNotThrow()
        .equals(false)
    ),
    createTest('getDriver(...) with no driver', () =>
      it(() =>
        testObject.getDriver({
          make: 'Lamborghini',
          year: 2018,
          model: 'Huracan Performante',
          power: 640,
          powertrain: 'gas',
          isFast: true,
        })
      )
        .didNotThrow()
        .equals(undefined)
    ),
    createTest('getDriver(...) with driver', () =>
      it(() =>
        testObject.getDriver({
          make: 'Lamborghini',
          year: 2018,
          model: 'Huracan Performante',
          power: 640,
          powertrain: 'gas',
          driver: { age: 24, name: 'marc' },
          isFast: true,
        })
      )
        .didNotThrow()
        .equals({ age: 24, name: 'marc' })
    ),
    createTest('jsStyleObjectAsParameters()', async () =>
      (
        await it(() =>
          timeoutedPromise<number>((complete) => {
            testObject.jsStyleObjectAsParameters({
              value: 55,
              onChanged: (num) => complete(num),
            })
          })
        )
      )
        .didNotThrow()
        .didReturn('number')
        .equals(55)
    ),

    // Hybrid Object Tests
    createTest('get self', () =>
      it(() => testObject.thisObject)
        .didNotThrow()
        .didReturn('object')
        .toContain('bigintValue')
        .toContain('boolValue')
        .toContain('stringValue')
    ),
    createTest('newTestObject()', () =>
      it(() => testObject.newTestObject())
        .didNotThrow()
        .didReturn('object')
        .toContain('bigintValue')
        .toContain('boolValue')
        .toContain('stringValue')
    ),

    // ArrayBuffers
    createTest('createArrayBuffer()', () =>
      it(() => testObject.createArrayBuffer())
        .didNotThrow()
        .didReturn('object')
    ),
    createTest('createArrayBufferFromNativeBuffer(copy)', () =>
      it(() => testObject.createArrayBufferFromNativeBuffer(true))
        .didNotThrow()
        .didReturn('object')
    ),
    createTest('createArrayBufferFromNativeBuffer(wrap)', () =>
      it(() => testObject.createArrayBufferFromNativeBuffer(false))
        .didNotThrow()
        .didReturn('object')
    ),
    createTest('getBufferLastItem(...) == 5', () =>
      it(() => {
        const buffer = new Uint8Array([13, 20, 55])
        return testObject.getBufferLastItem(buffer.buffer)
      })
        .didNotThrow()
        .equals(55)
    ),
    createTest('setAllValuesTo(...)', () =>
      it(() => {
        const buffer = new Uint8Array(30)
        testObject.setAllValuesTo(buffer.buffer, 55)
        return buffer.every((v) => v === 55)
      })
        .didNotThrow()
        .equals(true)
    ),
    createTest('createArrayBufferAsync()', async () =>
      (await it(() => testObject.createArrayBufferAsync()))
        .didNotThrow()
        .didReturn('object')
    ),
    createTest('copyArrayBuffer(JS buffer) equals', async () =>
      it(() => {
        // 1. Create JS buffer where value[73] is 4
        const original = new ArrayBuffer(1024)
        const originalArray = new Uint8Array(original)
        originalArray[73] = 4
        // 2. Copy the buffer
        const copyBuffer = testObject.copyBuffer(original)
        const copyArray = new Uint8Array(copyBuffer)
        // 3. Compare if the value at [73] is still equal
        return copyArray[73]
      })
        .didNotThrow()
        .equals(4)
    ),
    createTest('copyArrayBuffer(buffer) equals', async () =>
      it(() => {
        // 1. Create JS buffer where value[73] is 4
        const original = testObject.createArrayBuffer()
        const originalArray = new Uint8Array(original)
        originalArray[73] = 4
        // 2. Copy the buffer
        const copyBuffer = testObject.copyBuffer(original)
        const copyArray = new Uint8Array(copyBuffer)
        // 3. Compare if the value at [73] is still equal
        return copyArray[73]
      })
        .didNotThrow()
        .equals(4)
    ),
    createTest('copyArrayBuffer(native buffer) equals', async () =>
      it(() => {
        // 1. Create native buffer where value[73] is 4
        const original = testObject.createArrayBufferFromNativeBuffer(false)
        const originalArray = new Uint8Array(original)
        originalArray[73] = 4
        // 2. Copy the buffer
        const copyBuffer = testObject.copyBuffer(original)
        const copyArray = new Uint8Array(copyBuffer)
        // 3. Compare if the value at [73] is still equal
        return copyArray[73]
      })
        .didNotThrow()
        .equals(4)
    ),
    createTest('bounceArrayBuffer(js buffer) equals [73]', async () =>
      it(() => {
        // 1. Create js buffer where value[73] is 4
        const originalArray = new Uint8Array(100)
        originalArray[73] = 4
        // 2. Do JS -> native -> JS roundtrip
        const bouncedBuffer = testObject.bounceArrayBuffer(originalArray.buffer)
        const bouncedArray = new Uint8Array(bouncedBuffer)
        // 3. Compare if the value at [73] is still equal
        return bouncedArray[73]
      })
        .didNotThrow()
        .equals(4)
    ),
    createTest('bounceArrayBuffer(native buffer) equals [73]', async () =>
      it(() => {
        // 1. Create js buffer where value[73] is 4
        const original = testObject.createArrayBuffer()
        const originalArray = new Uint8Array(original)
        originalArray[73] = 4
        // 2. Do JS -> native -> JS roundtrip
        const bouncedBuffer = testObject.bounceArrayBuffer(originalArray.buffer)
        const bouncedArray = new Uint8Array(bouncedBuffer)
        // 3. Compare if the value at [73] is still equal
        return bouncedArray[73]
      })
        .didNotThrow()
        .equals(4)
    ),
    createTest('bounceArrayBuffer(js buffer) strict equals', async () =>
      it(() => {
        // 1. Create js buffer where value[73] is 4
        const originalArray = new Uint8Array(100)
        originalArray[73] = 4
        // 2. Do JS -> native -> JS roundtrip
        const bouncedBuffer = testObject.bounceArrayBuffer(originalArray.buffer)
        const bouncedArray = new Uint8Array(bouncedBuffer)
        // 3. Compare if the value at [73] is still equal
        return bouncedArray.buffer === originalArray.buffer
      })
        .didNotThrow()
        .equals(true)
    ),

    // Base HybridObject inherited methods
    createTest('.toString()', () =>
      it(() => testObject.toString())
        .didNotThrow()
        .didReturn('string')
        .equals(`[HybridObject ${testObject.name}]`)
    ),
    createTest('.name', () =>
      it(() => testObject.name)
        .didNotThrow()
        .didReturn('string')
    ),
    createTest('.equals(...) == true', () =>
      it(() => testObject.equals(testObject))
        .didNotThrow()
        .equals(true)
    ),
    createTest('.equals(.self) == true', () =>
      it(() => testObject.equals(testObject.thisObject))
        .didNotThrow()
        .equals(true)
    ),
    createTest('.self == .self', () =>
      // eslint-disable-next-line no-self-compare
      it(() => testObject.thisObject === testObject.thisObject)
        .didNotThrow()
        .equals(true)
    ),
    createTest('.equals(newTestObject()) == false', () =>
      it(() => testObject.equals(testObject.newTestObject()))
        .didNotThrow()
        .equals(false)
    ),
    createTest('Object.keys(...)', () =>
      it(() => Object.keys(testObject))
        .didNotThrow()
        .didReturn('object')
        .toBeArray()
    ),
    ...('rawJsiFunc' in testObject
      ? [
          createTest('Call Raw JSI Func', () =>
            // @ts-expect-error
            it(() => testObject.rawJsiFunc(55, false, 'hello', { obj: true }))
              .didNotThrow()
              .equals([55, false, 'hello', { obj: true }])
          ),
        ]
      : [
          // Swift/Kotlin Test Objects don't have raw JSI functions!
        ]),

    createTest('createBase() works', () =>
      it(() => testObject.createBase())
        .didNotThrow()
        .didReturn('object')
        .toContain('baseValue')
    ),
    createTest('createChild() works', () =>
      it(() => testObject.createChild())
        .didNotThrow()
        .didReturn('object')
        .toContain('childValue')
        .toContain('baseValue')
    ),
    createTest('createBase() has name "Base"', () =>
      it(() => testObject.createBase().name)
        .didNotThrow()
        .equals('Base')
    ),
    createTest('createChild() has name "Child"', () =>
      it(() => testObject.createChild().name)
        .didNotThrow()
        .equals('Child')
    ),
    createTest('createBaseActualChild() has name "Child"', () =>
      it(() => testObject.createBaseActualChild().name)
        .didNotThrow()
        .equals('Child')
    ),
    createTest('createBaseActualChild() works', () =>
      it(() => testObject.createBaseActualChild())
        .didNotThrow()
        .didReturn('object')
        .toContain('baseValue')
    ),
    createTest('createBaseActualChild() is actually a child', () =>
      it(() => testObject.createBaseActualChild())
        .didNotThrow()
        .didReturn('object')
        // @ts-expect-error
        .toContain('childValue')
        .toContain('baseValue')
    ),
    createTest('bounceChild(Child) ===', () =>
      it(() => {
        const child = testObject.createChild()
        const bounced = testObject.bounceChild(child)
        return bounced === child
      })
        .didNotThrow()
        .equals(true)
    ),
    createTest('bounceBase(Base) ===', () =>
      it(() => {
        const base = testObject.createBase()
        const bounced = testObject.bounceBase(base)
        return bounced === base
      })
        .didNotThrow()
        .equals(true)
    ),
    createTest('bounceBase(Child) ===', () =>
      it(() => {
        const child = testObject.createChild()
        const bounced = testObject.bounceBase(child)
        return bounced === child
      })
        .didNotThrow()
        .equals(true)
    ),
    createTest('bounceChild(Base) throws', () =>
      it(() => {
        if (__DEV__) {
          const child = testObject.createBase()
          // @ts-expect-error
          testObject.bounceChild(child)
        } else {
          // This only throws in __DEV__ - in release it is optimized away and would crash. :)
          throw new Error(
            `This only throws in __DEV__ - in release it is optimized away and would crash. :)`
          )
        }
      }).didThrow()
    ),
    createTest('bounceChildBase(Child) ===', () =>
      it(() => {
        const child = testObject.createChild()
        const bounced = testObject.bounceChildBase(child)
        return bounced === child
      })
        .didNotThrow()
        .equals(true)
    ),
    createTest('castBase(Child) works', () =>
      it(() => {
        const child = testObject.createChild()
        const bounced = testObject.castBase(child)
        return bounced === child
      })
        .didNotThrow()
        .equals(true)
    ),
    createTest('callbackSync(() => number) returns same number', () =>
      it(() => {
        return testObject.callbackSync(() => 55)
      })
        .didNotThrow()
        .equals(55)
    ),
    createTest('new T() works', () =>
      it(() => {
        const HybridTestObjectCpp =
          getHybridObjectConstructor<TestObjectCpp>('TestObjectCpp')
        const instance = new HybridTestObjectCpp()
        return instance
      })
        .didNotThrow()
        .toContain('boolValue')
    ),
    createTest('new T() instanceof works', () =>
      it(() => {
        const HybridTestObjectCpp =
          getHybridObjectConstructor<TestObjectCpp>('TestObjectCpp')
        const instance = new HybridTestObjectCpp()
        return instance instanceof HybridTestObjectCpp
      })
        .didNotThrow()
        .equals(true)
    ),
    createTest('{} instanceof works', () =>
      it(() => {
        const HybridTestObjectCpp =
          getHybridObjectConstructor<TestObjectCpp>('TestObjectCpp')
        return {} instanceof HybridTestObjectCpp
      })
        .didNotThrow()
        .equals(false)
    ),
    createTest('new T() =/= new T()', () =>
      it(() => {
        const HybridTestObjectCpp =
          getHybridObjectConstructor<TestObjectCpp>('TestObjectCpp')
        const a = new HybridTestObjectCpp()
        const b = new HybridTestObjectCpp()
        return a === b
      })
        .didNotThrow()
        .equals(false)
    ),
    createTest('new T() a == a', () =>
      it(() => {
        const HybridTestObjectCpp =
          getHybridObjectConstructor<TestObjectCpp>('TestObjectCpp')
        const a = new HybridTestObjectCpp()
        // eslint-disable-next-line no-self-compare
        return a === a
      })
        .didNotThrow()
        .equals(true)
    ),
    createTest('testObject.dispose() works and calls callback', async () =>
      (
        await it(() =>
          timeoutedPromise<boolean>((complete) => {
            const hybridObject = testObject.newTestObject()
            hybridObject.optionalCallback = () => {
              complete(true)
            }
            // dispose() will call this.optionalCallback() one last time then the object is gone
            hybridObject.dispose()
          })
        )
      )
        .didNotThrow()
        .equals(true)
    ),
    createTest('NitroModules.updateMemorySize(obj) works (roundtrip)', () =>
      it(() => {
        NitroModules.updateMemorySize(testObject)
      }).didNotThrow()
    ),
    createTest('NitroModules.buildType holds a string', () =>
      it(() => {
        return NitroModules.buildType
      })
        .didNotThrow()
        .didReturn('string')
    ),
    createTest('NitroModules.version holds a string', () =>
      it(() => {
        return NitroModules.version
      })
        .didNotThrow()
        .didReturn('string')
    ),
    createTest('NitroModules.getAllHybridObjectNames() returns an array', () =>
      it(() => {
        return NitroModules.getAllHybridObjectNames()
      })
        .didNotThrow()
        .toBeArray()
    ),
    createTest('NitroModules.box(testObject) returns an object', () =>
      it(() => {
        return NitroModules.box(testObject)
      })
        .didNotThrow()
        .didReturn('object')
    ),
    createTest(
      'NitroModules.box(testObject).unbox() returns the same object',
      () =>
        it(() => {
          const boxed = NitroModules.box(testObject)
          const original = boxed.unbox()
          return original === testObject
        })
          .didNotThrow()
          .equals(true)
    ),
    createTest('NitroModules.hasHybridObject(testObject.name) to be true', () =>
      it(() => {
        return NitroModules.hasHybridObject(testObject.name)
      })
        .didNotThrow()
        .equals(true)
    ),
    createTest('NitroModules.hasNativeState(testObject) to be true', () =>
      it(() => {
        return NitroModules.hasNativeState(testObject)
      })
        .didNotThrow()
        .equals(true)
    ),
  ]
}
