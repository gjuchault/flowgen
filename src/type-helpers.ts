/**
 * Extract the error type from a generator
 *
 * Example:
 *
 * ```ts
 * type Error = GenError<AsyncGenerator<string, number>>; // Error = string
 * type Error = GenError<Generator<string, number>>; // Error = string
 * ```
 */
export type GenError<Gen extends AsyncGenerator | Generator> =
	Gen extends AsyncGenerator<infer Error>
		? Error
		: Gen extends Generator<infer Error>
			? Error
			: never;

/**
 * Extract the value type from a generator
 *
 * Example:
 *
 * ```ts
 * type Value = GenValue<AsyncGenerator<string, number>>; // Value = number
 * type Value = GenValue<Generator<string, number>>; // Value = number
 * ```
 */
export type GenValue<Gen extends AsyncGenerator | Generator> =
	Gen extends AsyncGenerator<unknown, infer Value>
		? Value
		: Gen extends Generator<unknown, infer Value>
			? Value
			: never;
