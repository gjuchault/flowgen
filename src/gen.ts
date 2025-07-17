import { never } from "./never.ts";

/**
 * This method turns a sync/async method into a generator.
 *
 * Example:
 *
 * ```ts
 * import fs from "node:fs/promises";
 *
 * const readFile = gen(
 *   async (path: string) => {
 *     return await fs.readFile(path, "utf-8");
 *   },
 *   () => ({ name: "ioError", message: "File not found" })
 * );
 *
 * const result = flow(async function* () {
 *   const file = yield* readFile("file.txt");
 *
 *   return file;
 * });
 * ```
 *
 * @param callback - The method to turn into a generator
 * @param unhandledError - The function to handle unhandled errors
 * @returns A generator that returns the value of the method
 *
 */
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
			/* c8 ignore next 3 */
			// this can never be called since flow will only call next() once
			return never();
		}
	};
}
