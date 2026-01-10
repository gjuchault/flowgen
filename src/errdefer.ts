export interface Errdefer<Error> {
	type: "errdefer";
	callback: (error: Error) => void | Promise<void>;
}

export function* errdefer<Error>(
	callback: (err: Error) => void | Promise<void>,
): Generator<Errdefer<Error>, void, unknown> {
	yield { type: "errdefer", callback };
}

export function isErrdefer<Error>(obj: unknown): obj is Errdefer<Error> {
	return (
		typeof obj === "object" &&
		obj !== null &&
		"type" in obj &&
		obj.type === "errdefer"
	);
}
