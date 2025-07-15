import { deepEqual, equal, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { setTimeout as sleep } from "node:timers/promises";
import { flow, never } from "../index.ts";
import { type TimeoutError, timeout } from "../timeout.ts";

type CustomError = { name: "customError"; message: string };

await describe("timeout()", async () => {
	async function* sleeper(ms: number, fails: boolean) {
		await sleep(ms);
		if (fails) {
			yield { name: "customError", message: "fail!" } satisfies CustomError;
		}

		return ms;
	}

	await describe("when the generator completes before the timeout", async () => {
		it("should return the generator's value", async () => {
			const timeStart = Date.now();
			const result = await flow(timeout(50, sleeper(20, false)));
			const timeEnd = Date.now();

			ok(result.ok === true);
			equal(result.value, 20);
			ok(timeEnd - timeStart < 25);
		});
	});

	await describe("when the timeout triggers before the generator completes", async () => {
		it("should return a TimeoutError", async () => {
			const timeStart = Date.now();
			const result = await flow(timeout(20, sleeper(50, false)));
			const timeEnd = Date.now();

			ok(result.ok === false);
			deepEqual(result.error, { name: "timeoutError", timeoutInMs: 20 });
			ok(timeEnd - timeStart < 25);
		});
	});

	await describe("when the generator yields an error before the timeout", async () => {
		it("should return the generator's error", async () => {
			const result = await flow(timeout(50, sleeper(20, true)));
			ok(result.ok === false);
			deepEqual(result.error, { name: "customError", message: "fail!" });
		});
	});
});
