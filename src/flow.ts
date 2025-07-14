export async function flow<Error, Value>(
	generator: () => Generator<Error, Value> | AsyncGenerator<Error, Value>,
): Promise<{ ok: true; value: Value } | { ok: false; error: Error }> {
	const step = await generator().next();

	if (step.done === false) {
		return { ok: false, error: step.value };
	}

	return { ok: true, value: step.value as Value };
}
