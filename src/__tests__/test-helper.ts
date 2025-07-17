import { gen } from "../gen.ts";
import { never } from "../never.ts";

export type Expect<T extends true> = T;
export type TypesMatch<T, U> = T extends U ? true : false;

export type GenError = { name: "genError"; error: Error };
export type AsyncGenError = { name: "asyncGenError"; error: Error };
export type MethodError = { name: "methodError"; error: Error };
export type AsyncMethodError = { name: "asyncMethodError"; error: Error };

export function* depGenerator(value: number, fails: boolean = false) {
	if (fails) {
		yield {
			name: "genError",
			error: new Error("depGenerator failed"),
		} satisfies GenError;
		return never();
	}

	return value;
}

export async function* depAsyncGenerator(
	value: number,
	fails: boolean = false,
) {
	if (fails) {
		yield {
			name: "asyncGenError",
			error: new Error("depAsyncGenerator failed"),
		} satisfies AsyncGenError;
		return never();
	}

	return value;
}

export function depMethod(value: number, fails: boolean = false) {
	if (fails) {
		throw new Error("depMethod failed");
	}

	return value;
}

export async function depAsyncMethod(value: number, fails: boolean = false) {
	if (fails) {
		throw new Error("depAsyncMethod failed");
	}

	return value;
}

export function oneMethodToRuleThemAll(
	failingDependency?: "gen" | "asyncGen" | "method" | "asyncMethod",
) {
	return async function* wrapper() {
		const a = yield* depGenerator(1, failingDependency === "gen");
		const b = yield* depAsyncGenerator(2, failingDependency === "asyncGen");
		const c = yield* gen(
			depMethod,
			(error) =>
				({
					name: "methodError",
					error: error as Error,
				}) satisfies MethodError,
		)(3, failingDependency === "method");
		const d = yield* gen(
			depAsyncMethod,
			(error) =>
				({
					name: "asyncMethodError",
					error: error as Error,
				}) satisfies AsyncMethodError,
		)(4, failingDependency === "asyncMethod");

		return a + b + c + d;
	};
}
