# flowgen

Type-safe error management using generators. Inspired by [EffectTS](https://effect.website/) and [typescript-result](https://github.com/everweij/typescript-result)

- [Usage](#usage)
  - [Without flowgen](#without-flowgen)
  - [With Result pattern](#with-result-pattern)
  - [With flowgen](#with-flowgen)
- [API](#api)
  - [`flow(generator)`](#flowgenerator)
  - [`gen(callback)`](#gencallback)
  - [`never()`](#never)
  - [`noop()`](#noop)
  - [`identity()`](#identity)
  - [`all()`](#all)
  - [`race()`](#race)
  - [`timeout()`](#timeout)

## Usage

### Without flowgen

You throw your errors and thus relies on untyped goto-like pattern:

```ts
async function dependency(a: number, b: number): number {
  if (value === 0) {
    throw new Error(`Invalid denominator: ${b}`);
  }

  return a / b;
}

async function main(userInput: number) {
  try {
    const result = await dependency(10, userInput);

    console.log(result);
  } catch (error /* error is unknown */) {
    console.log("Some error happened", error);
  }
}
```

### With Result pattern

You have verbose but type-safe code. For every result you have to check if the result is an error:

```ts
type Result<Value, Error> =
  | { ok: true; value: Value }
  | { ok: false; error: Error };

async function dependency(
  a: number,
  b: number
): Promise<Result<number, { name: "valueError"; message: string }>> {
  if (b === 0) {
    return {
      ok: false,
      error: { name: "valueError", message: `Invalid denominator: ${b}` },
    };
  }

  return { ok: true, value: a / b };
}

async function main(userInput: number) {
  const result = await dependency(10, userInput);

  // for every method you call, you need to infer `Result` to a successful state
  if (result.ok == false) {
    console.log(
      "Some error happened",
      result.error /* error is properly typed */
    );
    return;
  }

  console.log(result.value);
}
```

### With flowgen

You get automatic typing for errors and returns:

```ts
async function* dependency(
  a: number,
  b: number
): AsyncGenerator<Error, number> {
  if (b === 0) {
    yield new Error(`Invalid denominator: ${b}`);
  }

  return a / b;
}

async function main(userInput: number) {
  const result = await flow(async function* () {
    // yield intermediate method which unwraps the value, no chains of `if error early return`
    const value = yield* dependency(10, userInput); // value is number

    return value;
  });

  // only one error management per flow, an exhaustive switch works well
  if (result.ok === false) {
    console.log(
      "Some error happened",
      result.error /* error is properly typed */
    );
    return;
  }

  console.log(result.value);
}
```

## API

### `flow(generator)`

```ts
async function flow<Error, Value>(
  generator: () => Generator<Error, Value> | AsyncGenerator<Error, Value>
): Promise<{ ok: true; value: Value } | { ok: false; error: Error }>;

// or the wrapper one:
function wrapFlow<Parameters extends unknown[], Error, Value>(
  generator: (
    ...args: Parameters
  ) => Generator<Error, Value> | AsyncGenerator<Error, Value>
): (
  ...args: Parameters
) => Promise<{ ok: true; value: Value } | { ok: false; error: Error }>;
```

This method turns a generator into a promise. Useful as entrypoint before using generators.
Inside the generator, always `yield*` other generators.

Example:

```ts
const result = await flow(async function* () {
  const a = yield* serviceA.methodA();
  const b = yield* serviceB.methodB(a);
  const c = yield* serviceC.methodC(b);

  return c;
});

if (result.ok === false) {
  // deal with result.error which is an union of errors yielded by methodA, methodB or methodC
}

// deal with result.value which is equal to `c`
```

Example with `wrapFlow`:

```ts
async function* someGenerator(value: number) {
  const a = yield* serviceA.methodA(value);
  const b = yield* serviceB.methodB(a);
  const c = yield* serviceC.methodC(b);

  return c;
}

const result = await wrapFlow(someGenerator)(42);

if (result.ok === false) {
  // deal with result.error which is an union of errors yielded by methodA, methodB or methodC
}

// deal with result.value which is equal to `c`
```

### `gen(callback)`

```ts
function gen<Parameters extends unknown[], Error, Value>(
  callback: (...args: Parameters) => Value | Promise<Value>,
  unhandledError: (error: unknown) => Error = (error) => error as Error
): (...args: Parameters) => AsyncGenerator<Error, Value>;
```

This method turns a sync/async method into a generator.

Example:

```ts
import fs from "node:fs/promises";
const readFile = gen(
  async (path: string) => {
    return await fs.readFile(path, "utf-8");
  },
  () => ({ name: "ioError", message: "File not found" })
);

const result = flow(async function* () {
  const file = yield* readFile("file.txt");

  return file;
});
```

### `never()`

```ts
function never(): never;
```

A never helper. Can be useful when you want to infer a value after yielding an error.

Example:

```ts
async function* method(a: 1 | 2): AsyncGenerator<Error, number> {
  if (a === 1) {
    yield new Error(`Invalid denominator: ${a}`);
    never();
  }

  return a; // inferred to 2
}
```

### `noop()`

```ts
function noop(): AsyncGenerator<never, void>;
```

A noop helper. Can be useful when you want to yield nothing just to please the linter.

Example:

```ts
async function* method() {
  yield* noop();

  return 42;
}
```

### `identity()`

```ts
function identity<Value>(value: Value): AsyncGenerator<never, Value>;
```

A noop helper. Can be useful when you want to yield a value

Example:

```ts
async function* method() {
  return yield* identity(42);
}
```

### `all()`

Similar to `Promise.all()` for generators

```ts
function all<Error, Value>(
  generators: AsyncGenerator<Error, Value>[]
): () => AsyncGenerator<Error, Value[]>;
```

Example:

```ts
async function* dep1() {
  await setTimeout(50);
  return 1;
}

async function* dep2() {
  await setTimeout(80);
  return 1;
}

const result = flow(async function* () {
  // runs in parallel
  const [a, b] = yield* all([dep1(), dep2()]);
});
```

### `race()`

Similar to `Promise.race()` for generators

```ts
function race<Error, Value>(
  generators: AsyncGenerator<Error, Value>[]
): () => AsyncGenerator<Error, Value>;
```

Example:

```ts
async function* dep1() {
  await setTimeout(50);
  return 1;
}

async function* dep2() {
  await setTimeout(80);
  return 2;
}

const result = flow(async function* () {
  // runs in parallel
  const a = yield* race([dep1(), dep2()]);
  // a = 1 since dep1 is faster than dep2
});
```

### `timeout()`

Helper to make a generator not exceed a specific time

```ts
function timeout<Error, Value>(
  timeoutInMs: number,
  generator: AsyncGenerator<Error, Value>
): () => AsyncGenerator<Error | TimeoutError, Value>;
```

Example:

```ts
async function* dep1() {
  await setTimeout(50);
  return 1;
}

const result = flow(async function* () {
  const a = yield* timeout(100, dep1());
  // a = 1 since dep1 is fast enough

  const b = yield* timeout(10, dep1());
  // this will timeout and result will be a TimeoutError
});
```

### `unsafeFlowOrThrow()`

Similar to [`flow`](https://github.com/gjuchault/flowgen?tab=readme-ov-file#flowgenerator) but returns the value or throws instead of returning a result. This will mute error type-safety, use it with caution

```ts
unsafeFlowOrThrow<Value>(
	callback: () => Generator<unknown, Value> | AsyncGenerator<unknown, Value>,
): Promise<Value>
```

Example:

```ts
async function* method() {
  // this is 100% safe
  const a = yield* identity(1);
  const b = yield* identity(2);

  return a + b;
}

const value = await unsafeFlowOrThrow(method); // value = 3
```
