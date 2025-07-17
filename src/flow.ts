/**
 * This method turns a generator into a promise. Useful as entrypoint before using generators.
 * Inside the generator, always `yield*` other generators.
 *
 * Example:
 *
 * ```ts
 * const result = await flow(async function* () {
 *   const a = yield* serviceA.methodA();
 *   const b = yield* serviceB.methodB(a);
 *   const c = yield* serviceC.methodC(b);

 *   return c;
 * });
 *
 * if (result.ok === false) {
 *   // deal with result.error which is an union of errors yielded by methodA, methodB or methodC
 * }
 *
 * // deal with result.value which is equal to `c`
 * ```
 * @param generator - The generator to turn into a promise
 * @returns A promise that resolves to a result containing the value of the generator or the error
 *
 */
export async function flow<Error, Value>(
	generator: () => Generator<Error, Value> | AsyncGenerator<Error, Value>,
): Promise<{ ok: true; value: Value } | { ok: false; error: Error }> {
	const step = await generator().next();

	if (step.done === false) {
		return { ok: false, error: step.value };
	}

	return { ok: true, value: step.value as Value };
}

/**
 * Similar to `flow` but returns a function instead of a promise directly
 *
 * Example:
 *
 * ```ts
 * async function* someGenerator(value: number) {
 *   const a = yield* serviceA.methodA(value);
 *   const b = yield* serviceB.methodB(a);
 *   const c = yield* serviceC.methodC(b);
 *
 *   return c;
 * }
 *
 * const result = await wrapFlow(someGenerator)(42);
 *
 * if (result.ok === false) {
 *   // deal with result.error which is an union of errors yielded by methodA, methodB or methodC
 * }
 *
 * // deal with result.value which is equal to `c`
 * ```
 *
 * @param generator - The generator to turn into a function
 * @returns A function that returns a promise that resolves to a result containing the value of the generator or the error
 *
 */
export function wrapFlow<Parameters extends unknown[], Error, Value>(
	generator: (
		...args: Parameters
	) => Generator<Error, Value> | AsyncGenerator<Error, Value>,
): (
	...args: Parameters
) => Promise<{ ok: true; value: Value } | { ok: false; error: Error }> {
	return async (...args: Parameters) => {
		return await flow(() => generator(...args));
	};
}

/**
 * Similar to `flow` but throws an error if the generator returns an error
 *
 * Example:
 * ```ts
 * async function* method() {
 *   // this is 100% safe
 *   const a = yield* identity(1);
 *   const b = yield* identity(2);
 *
 *   return a + b;
 * }
 *
 * const value = await unsafeFlowOrThrow(method); // value = 3
 * ```
 *
 * @param callback - The generator to turn into a promise
 * @returns The value of the generator
 *
 */
export async function unsafeFlowOrThrow<Value>(
	callback: () => Generator<unknown, Value> | AsyncGenerator<unknown, Value>,
): Promise<Value> {
	const result = await flow(callback);

	if (result.ok === false) {
		throw new Error("Unwrapping error", { cause: result.error });
	}

	return result.value;
}
