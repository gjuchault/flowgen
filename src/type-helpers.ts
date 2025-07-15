export type GenError<Gen extends AsyncGenerator | Generator> =
	Gen extends AsyncGenerator<infer Error>
		? Error
		: Gen extends Generator<infer Error>
			? Error
			: never;

export type GenValue<Gen extends AsyncGenerator | Generator> =
	Gen extends AsyncGenerator<unknown, infer Value>
		? Value
		: Gen extends Generator<unknown, infer Value>
			? Value
			: never;
