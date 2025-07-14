import { equal, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { flow, gen, never } from "../index.ts";

type GenError = { name: "genError"; error: Error };
type AsyncGenError = { name: "asyncGenError"; error: Error };
type MethodError = { name: "methodError"; error: Error };
type AsyncMethodError = { name: "asyncMethodError"; error: Error };

function* depGenerator(value: number, fails: boolean = false) {
	if (fails) {
		yield {
			name: "genError",
			error: new Error("depGenerator failed"),
		} satisfies GenError;
		return never();
	}

	return value;
}

async function* depAsyncGenerator(value: number, fails: boolean = false) {
	if (fails) {
		yield {
			name: "asyncGenError",
			error: new Error("depAsyncGenerator failed"),
		} satisfies AsyncGenError;
		return never();
	}

	return value;
}

function depMethod(value: number, fails: boolean = false) {
	if (fails) {
		throw new Error("depMethod failed");
	}

	return value;
}

async function depAsyncMethod(value: number, fails: boolean = false) {
	if (fails) {
		throw new Error("depAsyncMethod failed");
	}

	return value;
}

function wrapper(
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

await describe("flowgen", async () => {
	await describe("when called with successful dependencies", async () => {
		await it("returns the dependencies values", async () => {
			const result = await flow(wrapper());

			ok(result.ok === true);
			equal(result.value, 10);
		});
	});

	await describe("when called with unsuccessful dependencies", async () => {
		await it("returns the dependencies errors", async () => {
			const generatorFails = await flow(wrapper("gen"));

			ok(generatorFails.ok === false);
			equal(generatorFails.error.name, "genError");
			equal(generatorFails.error.error.message, "depGenerator failed");

			const asyncGeneratorFails = await flow(wrapper("asyncGen"));

			ok(asyncGeneratorFails.ok === false);
			equal(asyncGeneratorFails.error.name, "asyncGenError");
			equal(
				asyncGeneratorFails.error.error.message,
				"depAsyncGenerator failed",
			);

			const methodFails = await flow(wrapper("method"));

			ok(methodFails.ok === false);
			equal(methodFails.error.name, "methodError");
			equal(methodFails.error.error.message, "depMethod failed");

			const asyncMethodFails = await flow(wrapper("asyncMethod"));

			ok(asyncMethodFails.ok === false);
			equal(asyncMethodFails.error.name, "asyncMethodError");
			equal(asyncMethodFails.error.error.message, "depAsyncMethod failed");
		});
	});
});
