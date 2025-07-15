import { deepEqual, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { setTimeout } from "node:timers/promises";
import { flow, never } from "../index.ts";
import { race } from "../promise.ts";

await describe("race()", async () => {
	await describe("when called with multiple generators", async () => {
		async function* gen1(fails: boolean) {
			await setTimeout(50);

			if (fails) {
				yield new Error("Error from gen1");
				return never();
			}

			return 1;
		}

		async function* gen2(fails: boolean) {
			await setTimeout(80);

			if (fails) {
				yield new Error("Error from gen2");
				return never();
			}

			return 1;
		}

		await describe("when all generators succeed", async () => {
			it("should return the results of all generators", async () => {
				const timeStart = Date.now();
				const result = await flow(race([gen1(false), gen2(false)]));
				const timeEnd = Date.now();

				ok(result.ok === true);
				deepEqual(result.value, 1);
				ok(timeEnd - timeStart < 55);
			});
		});

		await describe("when one generator fails", async () => {
			it("should return the results of all generators", async () => {
				const timeStart = Date.now();
				const result = await flow(race([gen1(true), gen2(false)]));
				const timeEnd = Date.now();

				ok(result.ok === false);
				deepEqual(result.error.message, "Error from gen1");
				ok(timeEnd - timeStart < 55);

				const timeStart2 = Date.now();
				const result2 = await flow(race([gen1(false), gen2(true)]));
				const timeEnd2 = Date.now();

				ok(result2.ok === true);
				deepEqual(result2.value, 1);
				ok(timeEnd2 - timeStart2 < 55);
			});
		});
	});
});
