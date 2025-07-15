import { setTimeout } from "node:timers/promises";
import { never } from "./index.ts";
import { race } from "./promise.ts";

export type TimeoutError = { name: "timeoutError"; timeoutInMs: number };

async function* timeoutGenerator(
	timeoutInMs: number,
): AsyncGenerator<TimeoutError, never, never> {
	await setTimeout(timeoutInMs);
	yield { name: "timeoutError", timeoutInMs };
	return never();
}

export function timeout<Error, Value>(
	timeoutInMs: number,
	generator: AsyncGenerator<Error, Value>,
): () => AsyncGenerator<Error | TimeoutError, Value> {
	return race<Error | TimeoutError, Value>([
		generator,
		timeoutGenerator(timeoutInMs),
	]);
}
