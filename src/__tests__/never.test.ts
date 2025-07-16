import { equal, throws } from "node:assert/strict";
import { describe, it } from "node:test";
import { never } from "../never.ts";

await describe("never()", async () => {
	await describe("when called", async () => {
		await it("throws an error", async () => {
			await throws(
				() => never(),
				(err: Error) => {
					equal("never", err.message);
					return true;
				},
			);
		});
	});
});
