import { ZodNullable, ZodOptional, type ZodTypeAny } from "zod";

export type UnwrapNullish<T extends ZodTypeAny> = T extends ZodNullable<infer I>
  ? UnwrapNullish<I>
  : T extends ZodOptional<infer I>
  ? UnwrapNullish<I>
  : T;

/**
 *
 * @param t
 * @example `z.string().nullable().optional() -> z.string()`
 * @returns unwrap nullish into its innest type
 */
export const unwrapNullish = <T extends ZodTypeAny>(t: T): UnwrapNullish<T> => {
  if (t instanceof ZodNullable || t instanceof ZodOptional) {
    return unwrapNullish(t.unwrap());
  }
  return t as any;
};

export type ReplaceNullish<
  N extends ZodTypeAny,
  Inner extends ZodTypeAny,
> = N extends ZodNullable<infer I>
  ? ZodNullable<ReplaceNullish<I, Inner>>
  : N extends ZodOptional<infer I>
  ? ZodOptional<ReplaceNullish<I, Inner>>
  : Inner;

/**
 *
 * @param t
 * @example `z.string().nullable().optional(), z.number() -> z.number().nullable().optional()`
 * @returns replace nullish into for its innest type
 */
export const replaceNullish = <N extends ZodTypeAny, Inner extends ZodTypeAny>(
  t: N,
  inner: Inner,
): ReplaceNullish<N, Inner> => {
  if (t instanceof ZodNullable) {
    return replaceNullish(t.unwrap(), inner).nullable() as any;
  } else if (t instanceof ZodOptional) {
    return replaceNullish(t.unwrap(), inner).optional() as any;
  } else {
    return inner as any;
  }
};
