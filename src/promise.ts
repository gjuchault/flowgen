import { flow } from "./flow.ts";
import { gen } from "./gen.ts";

/**
 * Similar to `Promise.all()` for generators
 *
 * Example:
 *
 * ```ts
 * async function* dep1() {
 *   await setTimeout(50);
 *   return 1;
 * }
 *
 * async function* dep2() {
 *   await setTimeout(80);
 *   return 1;
 * }
 *
 * const result = flow(async function* () {
 *   // runs in parallel
 *   const [a, b] = yield* all([dep1(), dep2()]);
 * });
 * ```
 *
 * @param generators - The generators to race
 * @returns A generator that returns an array of values
 *
 */
export function all<Error, Value>(
	generators: AsyncGenerator<Error, Value>[],
): () => AsyncGenerator<Error, Value[]> {
	const allPromises = generators.map(async (generator) => {
		return await flow(() => generator);
	});

	return gen(
		async () => {
			const results = await Promise.all(allPromises);

			const values: Value[] = [];
			for (const result of results) {
				if (result.ok === false) {
					throw result.error;
				}

				values.push(result.value);
			}

			return values;
		},
		(error) => error as Error,
	);
}

/**
 * Similar to `Promise.race()` for generators
 *
 * Example:
 *
 * ```ts
 * async function* dep1() {
 *   await setTimeout(50);
 *   return 1;
 * }
 *
 * async function* dep2() {
 *   await setTimeout(80);
 *   return 2;
 * }
 *
 * 	const result = flow(async function* () {
 *   // runs in parallel
 *   const a = yield* race([dep1(), dep2()]);
 *   // a = 1 since dep1 is faster than dep2
 * });
 * ```
 *
 * @param generators - The generators to race
 * @returns A generator that returns the value of the first generator to complete
 *
 */
export function race<Error, Value>(
	generators: AsyncGenerator<Error, Value>[],
): () => AsyncGenerator<Error, Value> {
	const allPromises = generators.map(async (generator) => {
		return await flow(() => generator);
	});

	return gen(
		async () => {
			const result = await Promise.race(allPromises);

			if (result.ok === false) {
				throw result.error;
			}

			return result.value;
		},
		(error) => error as Error,
	);
}
