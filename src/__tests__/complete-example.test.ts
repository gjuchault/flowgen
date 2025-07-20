import { equal, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import {
	all,
	flow,
	gen,
	identity,
	never,
	noop,
	race,
	timeout,
	unsafeFlowOrThrow,
	wrapFlow,
} from "../index.ts";

await describe("full example", async () => {
	function staticDependency() {
		return "static";
	}

	async function asyncDependency() {
		return Promise.resolve("async");
	}

	async function slowDependency() {
		return new Promise<string>((resolve) => {
			setTimeout(() => {
				resolve("slow");
			}, 500);
		});
	}

	async function* generatorDependency() {
		const random = Math.random();
		const isError = random > 1;
		if (isError === true) {
			yield { name: "randomError", value: random } as const;
			never();
		}

		yield* noop();

		return yield* identity(random);
	}

	async function* generatorDependency2(divider: number) {
		if (divider === 0) {
			yield { name: "dividerIsZero" } as const;
		}

		return 42 / divider;
	}

	function unknownError(cause: unknown) {
		return { name: "unknownError", cause } as const;
	}

	await it("runs the example", async () => {
		// first step: wrap non-gen dependencies into generators with error wrapping
		const wrappedStatic = gen(staticDependency, unknownError);
		const wrappedAsync = gen(asyncDependency, unknownError);
		const wrappedSlow = gen(slowDependency, unknownError);

		// second step: create the flow
		async function* main() {
			// call generators with `yield*` to unwrap values
			const staticValue = yield* all([wrappedStatic(), wrappedAsync()]);
			const fastValue = yield* race([wrappedSlow(), wrappedAsync()]);

			const slowValue = yield* timeout(1000, wrappedSlow());
			const x = yield* generatorDependency();
			const y = yield* generatorDependency2(Math.ceil(x));

			return [
				Math.floor(y).toString(),
				slowValue,
				fastValue,
				...staticValue,
			].join("-");
		}

		const result = await flow(main);

		if (result.ok === false) {
			switch (result.error.name) {
				case "unknownError":
					// deal with it
					break;
				case "dividerIsZero":
					// deal with it
					break;
				default:
					never();
			}
		}
		// deal with result
		ok(result.ok === true);
		equal(result.value, "42-slow-async-static-async");

		// you can also use `unsafeFlowOrThrow` to throw the error
		const value = await unsafeFlowOrThrow(main);
		equal(value, "42-slow-async-static-async");

		// or make a function out of it
		const main2 = wrapFlow(main);
		const result2 = await main2();
		ok(result2.ok === true);
		equal(result2.value, "42-slow-async-static-async");
	});
});
