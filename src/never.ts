/**
 * A never helper. Can be useful when you want to infer a value after yielding an error.
 *
 * Example:
 *
 * ```ts
 * async function* method(a: 1 | 2): AsyncGenerator<Error, number> {
 *   if (a === 1) {
 *     yield new Error(`Invalid denominator: ${a}`);
 *     never();
 *   }
 *
 *   return a; // inferred to 2
 * }
 * ```
 */
export function never(): never {
	throw new Error("never");
}
