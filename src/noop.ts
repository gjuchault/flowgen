/**
 * A noop helper. Can be useful when you want to yield nothing just to please the linter.
 *
 * Example:
 *
 * ```ts
 * async function* method() {
 *   yield* noop();
 *
 *   return 42;
 * }
}
```
 */
export async function* noop(): AsyncGenerator<never, void> {}

/**
 * A noop helper. Can be useful when you want to yield a value
 *
 * Example:
 *
 * ```ts
 * async function* method() {
 *   return yield* identity(42);
 * }
 * ```
 *
 * @param value - The value to yield
 * @returns A generator that yields the value
 *
 */
export async function* identity<T>(value: T): AsyncGenerator<never, T> {
	yield* noop();
	return value;
}
