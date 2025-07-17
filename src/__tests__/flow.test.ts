import { equal, ok, rejects } from "node:assert/strict";
import { describe, it } from "node:test";
import { gen, unsafeFlowOrThrow, wrapFlow } from "../index.ts";
import {
	type AsyncGenError,
	depAsyncGenerator,
	depAsyncMethod,
	depGenerator,
	depMethod,
	type GenError,
} from "./test-helper.ts";

await describe("wrapFlow()", async () => {
	await describe("given a generator function", async () => {
		async function* generator(baseValue: number) {
			const a = yield* depGenerator(baseValue + 1);
			const b = yield* depAsyncGenerator(baseValue + 2);
			const c = yield* gen(depMethod)(baseValue + 3);
			const d = yield* gen(depAsyncMethod)(baseValue + 4);

			return a + b + c + d;
		}

		await it("returns a function that calls flow() with the arguments", async () => {
			const wrapper = wrapFlow(generator);

			const result = await wrapper(2);

			ok(result.ok === true);
			equal(result.value, 18);
		});
	});
});

await describe("unsafeFlowOrThrow()", async () => {
	await describe("given a generator that returns", async () => {
		await it("returns the value", async () => {
			equal(await unsafeFlowOrThrow(() => depAsyncGenerator(18)), 18);
		});
	});

	await describe("given a generator that returns", async () => {
		await it("throws the error", async () => {
			await rejects(
				async () => {
					await unsafeFlowOrThrow(() => depAsyncGenerator(18, true));
				},
				(err: Error) => {
					equal("Unwrapping error", err.message);
					equal("asyncGenError", (err.cause as AsyncGenError).name);
					equal(
						"depAsyncGenerator failed",
						(err.cause as AsyncGenError).error.message,
					);
					return true;
				},
			);

			await rejects(
				async () => {
					await unsafeFlowOrThrow(() => depGenerator(18, true));
				},
				(err: Error) => {
					equal("Unwrapping error", err.message);
					equal("genError", (err.cause as GenError).name);
					equal("depGenerator failed", (err.cause as GenError).error.message);
					return true;
				},
			);
		});
	});
});
