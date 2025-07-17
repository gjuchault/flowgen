import { equal } from "node:assert/strict";
import { describe, it } from "node:test";
import { unsafeFlowOrThrow } from "../flow.ts";
import { identity, noop } from "../noop.ts";

await describe("noop()", async () => {
	await describe("when called", async () => {
		await it("returns an empty generator", async () => {
			const result = await unsafeFlowOrThrow(noop);

			equal(result, undefined);
		});
	});
});

await describe("identity()", async () => {
	await describe("when called", async () => {
		await it("returns an empty generator", async () => {
			const result = await unsafeFlowOrThrow(() => identity(10));

			equal(result, 10);
		});
	});
});
