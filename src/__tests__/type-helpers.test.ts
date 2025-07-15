import { never } from "../index.ts";
import type { GenError, GenValue } from "../type-helpers.ts";
import type { Expect, TypesMatch } from "./test-helper.ts";

type Err = { name: "genError"; error: Error };

function* depGenerator(value: number, fails: boolean = false) {
	if (fails) {
		yield {
			name: "genError",
			error: new Error("depGenerator failed"),
		} satisfies Err;
		return never();
	}

	return value;
}

async function* depAsyncGenerator(value: number, fails: boolean = false) {
	if (fails) {
		yield {
			name: "genError",
			error: new Error("depAsyncGenerator failed"),
		} satisfies Err;
		return never();
	}

	return value;
}

type TestErrorExtract = Expect<
	TypesMatch<GenError<AsyncGenerator<string, number>>, string> &
		TypesMatch<GenError<ReturnType<typeof depGenerator>>, Err> &
		TypesMatch<GenError<ReturnType<typeof depAsyncGenerator>>, Err>
>;
type TestValueExtract = Expect<
	TypesMatch<GenValue<AsyncGenerator<string, number>>, number> &
		TypesMatch<GenValue<ReturnType<typeof depGenerator>>, number> &
		TypesMatch<GenValue<ReturnType<typeof depAsyncGenerator>>, number>
>;
const _test: TestErrorExtract & TestValueExtract = true;
void _test;
