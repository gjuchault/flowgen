export type Expect<T extends true> = T;
export type TypesMatch<T, U> = T extends U ? true : false;
