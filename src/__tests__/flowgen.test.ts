import { equal, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { flow, gen } from "../index.ts";
import { oneMethodToRuleThemAll } from "./test-helper.ts";

await describe("flow() and gen()", async () => {
	await describe("when called with successful dependencies", async () => {
		await it("returns the dependencies values", async () => {
			const result = await flow(oneMethodToRuleThemAll());

			ok(result.ok === true);
			equal(result.value, 10);
		});
	});

	await describe("when called with unsuccessful dependencies", async () => {
		await it("returns the dependencies errors", async () => {
			const generatorFails = await flow(oneMethodToRuleThemAll("gen"));

			ok(generatorFails.ok === false);
			equal(generatorFails.error.name, "genError");
			equal(generatorFails.error.error.message, "depGenerator failed");

			const asyncGeneratorFails = await flow(
				oneMethodToRuleThemAll("asyncGen"),
			);

			ok(asyncGeneratorFails.ok === false);
			equal(asyncGeneratorFails.error.name, "asyncGenError");
			equal(
				asyncGeneratorFails.error.error.message,
				"depAsyncGenerator failed",
			);

			const methodFails = await flow(oneMethodToRuleThemAll("method"));

			ok(methodFails.ok === false);
			equal(methodFails.error.name, "methodError");
			equal(methodFails.error.error.message, "depMethod failed");

			const asyncMethodFails = await flow(
				oneMethodToRuleThemAll("asyncMethod"),
			);

			ok(asyncMethodFails.ok === false);
			equal(asyncMethodFails.error.name, "asyncMethodError");
			equal(asyncMethodFails.error.error.message, "depAsyncMethod failed");
		});
	});

	await describe("when called with unsuccessful dependency and error handler", async () => {
		await it("returns the wrapped error", async () => {
			function method() {
				throw new Error("Can do this operation");
			}
			const generator = gen(method, (cause: unknown) => ({
				name: "methodError",
				cause,
			}));
			const result = await flow(generator);

			ok(result.ok === false);
			equal(result.error.name, "methodError");
			equal((result.error.cause as Error).message, "Can do this operation");
		});
	});

	await describe("when called with unsuccessful dependency and default error handler", async () => {
		await it("returns the wrapped error", async () => {
			function method() {
				throw new Error("Can do this operation");
			}
			const generator = gen(method);
			const result = await flow(generator);

			ok(result.ok === false);
			equal((result.error as Error).message, "Can do this operation");
		});
	});
});
