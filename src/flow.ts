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
