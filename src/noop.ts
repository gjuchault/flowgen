export async function* noop(): AsyncGenerator<never, void> {}

export async function* identity<T>(value: T): AsyncGenerator<never, T> {
	yield* noop();
	return value;
}
