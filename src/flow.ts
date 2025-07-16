export async function flow<Error, Value>(
	generator: () => Generator<Error, Value> | AsyncGenerator<Error, Value>,
): Promise<{ ok: true; value: Value } | { ok: false; error: Error }> {
	const step = await generator().next();

	if (step.done === false) {
		return { ok: false, error: step.value };
	}

	return { ok: true, value: step.value as Value };
}

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

export async function unsafeFlowOrThrow<Value>(
	callback: () => Generator<unknown, Value> | AsyncGenerator<unknown, Value>,
): Promise<Value> {
	const result = await flow(callback);

	if (result.ok === false) {
		throw new Error("Unwrapping error", { cause: result.error });
	}

	return result.value;
}
