import { never } from "./index.ts";
import { race } from "./promise.ts";

async function sleep(
	timeoutInMs: number,
	{ signal }: { signal: AbortSignal },
): Promise<void> {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => resolve(), timeoutInMs);

		signal.addEventListener("abort", () => {
			clearTimeout(timeout);
			reject(new Error("Aborted"));
		});
	});
}

/**
 * The error type returned by the `timeout` function
 */
export type TimeoutError = { name: "timeoutError"; timeoutInMs: number };

async function* timeoutGenerator(
	timeoutInMs: number,
	signal: AbortSignal,
): AsyncGenerator<TimeoutError, never, never> {
	try {
		await sleep(timeoutInMs, { signal });
		yield { name: "timeoutError", timeoutInMs };
		/* c8 ignore next 3 */
		// this can never be called since flow will only call next() once
		return never();
	} catch {
		return never();
	}
}

/**
 * Helper to make a generator not exceed a specific time
 *
 * Example:
 *
 * ```ts
 * async function* dep1() {
 *   await setTimeout(50);
 *   return 1;
 * }
 *
 * const result = flow(async function* () {
 *   const a = yield* timeout(100, dep1());
 *   // a = 1 since dep1 is fast enough
 *
 *   const b = yield* timeout(10, dep1());
 *   // this will timeout and result will be a TimeoutError
 * });
 * ```
 *
 * @param timeoutInMs - The timeout in milliseconds
 * @param generator - The generator to wrap
 * @returns A generator
 *
 */
export function timeout<Error, Value>(
	timeoutInMs: number,
	generator: AsyncGenerator<Error, Value>,
): AsyncGenerator<Error | TimeoutError, Value> {
	return (async function* wrapped() {
		const ac = new AbortController();
		const signal = ac.signal;

		const result = yield* race<Error | TimeoutError, Value>([
			generator,
			timeoutGenerator(timeoutInMs, signal),
		]);

		ac.abort();

		return result;
	})();
}
