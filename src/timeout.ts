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

export function timeout<Error, Value>(
	timeoutInMs: number,
	generator: AsyncGenerator<Error, Value>,
): () => AsyncGenerator<Error | TimeoutError, Value> {
	return async function* wrapped() {
		const ac = new AbortController();
		const signal = ac.signal;

		const result = yield* race<Error | TimeoutError, Value>([
			generator,
			timeoutGenerator(timeoutInMs, signal),
		])();

		ac.abort();

		return result;
	};
}
