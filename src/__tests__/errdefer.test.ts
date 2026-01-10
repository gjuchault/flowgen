import { deepEqual, equal, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { errdefer } from "../errdefer.ts";
import { flow, gen, noop } from "../index.ts";

let globalTimeout1: NodeJS.Timeout;
let globalTimeout2: NodeJS.Timeout;

await describe("errdefer()", async () => {
	await describe("given two long living dependencies that register a timeout and a failing dependency", async () => {
		const genLongLivingDependency1 = gen(async function longLivingDependency() {
			globalTimeout1 = setTimeout(() => {}, 1000);
			return "done";
		});

		const genLongLivingDependency2 = gen(async function longLivingDependency() {
			globalTimeout2 = setTimeout(() => {}, 1000);
			return "done";
		});

		const genFailingDependency = gen(async function failingDependency() {
			throw new Error("some failing dependency");
		});

		await describe("given a main method that yields the generator and errdefer a cleanup", async () => {
			const cleanupOrder: number[] = [];

			async function* main() {
				const dependency1 = yield* genLongLivingDependency1();
				yield* errdefer((error) => {
					equal((error as Error).message, "some failing dependency");
					cleanupOrder.push(1);
					clearTimeout(globalTimeout1);
				});

				yield* noop();

				const dependency2 = yield* genLongLivingDependency2();
				yield* errdefer((error) => {
					equal((error as Error).message, "some failing dependency");
					cleanupOrder.push(2);
					clearTimeout(globalTimeout2);
				});
				const failingDependency = yield* genFailingDependency();

				return [dependency1, dependency2, failingDependency];
			}

			await it("should cleanup, in order", async () => {
				const result = await flow(main);
				ok(result.ok === false);
				equal((result.error as Error).message, "some failing dependency");
				deepEqual(cleanupOrder, [1, 2]);
			});
		});
	});
});
