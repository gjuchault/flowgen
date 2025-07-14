export function gen<Parameters extends unknown[], Error, Value>(
	callback: (...args: Parameters) => Value | Promise<Value>,
	unhandledError: (error: unknown) => Error = (error) => error as Error,
): (...args: Parameters) => AsyncGenerator<Error, Value> {
	return async function* (...args: Parameters) {
		try {
			const originalValue = await callback(...args);

			return originalValue;
		} catch (error) {
			yield unhandledError(error);

			return undefined as never;
		}
	};
}
