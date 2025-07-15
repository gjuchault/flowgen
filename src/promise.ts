import { flow } from "./flow.ts";
import { gen } from "./gen.ts";

export function all<Error, Value>(
	generators: AsyncGenerator<Error, Value>[],
): () => AsyncGenerator<Error, Value[]> {
	const allPromises = generators.map(async (generator) => {
		return await flow(() => generator);
	});

	return gen(
		async () => {
			const results = await Promise.all(allPromises);

			const values: Value[] = [];
			for (const result of results) {
				if (result.ok === false) {
					throw result.error;
				}

				values.push(result.value);
			}

			return values;
		},
		(error) => error as Error,
	);
}

export function race<Error, Value>(
	generators: AsyncGenerator<Error, Value>[],
): () => AsyncGenerator<Error, Value> {
	const allPromises = generators.map(async (generator) => {
		return await flow(() => generator);
	});

	return gen(
		async () => {
			const result = await Promise.race(allPromises);

			if (result.ok === false) {
				throw result.error;
			}

			return result.value;
		},
		(error) => error as Error,
	);
}
