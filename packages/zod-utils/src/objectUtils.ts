import {
  UnknownKeysParam,
  ZodNullable,
  ZodObject,
  ZodOptional,
  ZodRawShape,
  ZodTypeAny,
} from "zod";

import {
  type UnwrapNullish,
  type ReplaceNullish,
  replaceNullish,
  unwrapNullish,
} from "./nullishUtils";

type DeepPickMaskInner<
  T extends ZodTypeAny,
  U = UnwrapNullish<T>,
> = U extends ZodObject<ZodRawShape>
  ? {
      [K in keyof U["shape"]]?: DeepPickMaskInner<U["shape"][K]> | true;
    }
  : true;

export type DeepPickMask<T extends ZodRawShape> = DeepPickMaskInner<
  ZodObject<T>
>;

export type DeepPickMaskKeys<
  T extends ZodRawShape,
  Mask extends DeepPickMask<T> = DeepPickMask<T>,
  Keys extends keyof T = keyof T,
> = Keys extends keyof Mask
  ? Mask[Keys] extends true
    ? Keys
    : Mask[Keys] extends {}
    ? Keys
    : never
  : never;

type ReplaceShape<
  T extends ZodObject<ZodRawShape>,
  Shape extends ZodRawShape,
> = T extends ZodObject<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  infer _,
  infer UnknownKeys extends UnknownKeysParam,
  infer Catchall extends ZodTypeAny,
  infer Output,
  infer Input
>
  ? ZodObject<Shape, UnknownKeys, Catchall, Output, Input>
  : never;

export type DeepPickShape<
  T extends ZodRawShape,
  Mask extends DeepPickMask<T> = DeepPickMask<T>,
> = {
  [K in DeepPickMaskKeys<T, Mask>]: K extends keyof Mask
    ? Mask[K] extends true
      ? T[K]
      : Mask[K] extends {}
      ? T[K] extends ZodObject<ZodRawShape>
        ? ReplaceShape<T[K], DeepPickShape<T[K]["shape"], Mask[K]>>
        : T[K] extends ZodNullable<infer U>
        ? UnwrapNullish<U> extends ZodObject<infer Shape extends ZodRawShape>
          ? ReplaceNullish<
              T[K],
              ReplaceShape<
                UnwrapNullish<U>,
                DeepPickShape<Shape, Mask[K] & DeepPickMask<Shape>>
              >
            >
          : T[K]
        : T[K] extends ZodOptional<infer U>
        ? UnwrapNullish<U> extends ZodObject<infer Shape extends ZodRawShape>
          ? ReplaceNullish<
              T[K],
              ReplaceShape<
                UnwrapNullish<U>,
                DeepPickShape<Shape, Mask[K] & DeepPickMask<Shape>>
              >
            >
          : T[K]
        : never
      : never
    : never;
};

export type DeepPick<
  O extends ZodObject<ZodRawShape>,
  Mask extends DeepPickMask<O["shape"]>,
> = DeepPickShape<O["shape"], Mask> extends infer S extends ZodRawShape
  ? ReplaceShape<O, S>
  : never;

/**
 * @example
 * ```ts
 * const picked = deepPick(o, {
 *    a: true,
 *    nested: {
 *      c: true,
 *    },
 *  });
 * ```
 * @param type the ZodObject to pick deeply
 * @param mask the mask to pick deeply.
 * @returns the picked schema.
 * Note: optional and nullable fields will be picked for its inner type.
 */
export const deepPick = <
  O extends ZodObject<ZodRawShape>,
  const Mask extends DeepPickMask<O["shape"]>,
>(
  type: O,
  mask: Mask,
): DeepPick<O, Mask> => {
  const keys: Record<string, true> = {};

  for (const [key, value] of Object.entries(mask)) {
    if (value === true) {
      keys[key] = true;
    }
  }

  let current = type.pick(keys);

  for (const [key, value] of Object.entries(mask)) {
    if (typeof value === "object") {
      let sourceSchema = type.shape[key];
      let pickedSchema: any;

      if (sourceSchema instanceof ZodObject) {
        pickedSchema = deepPick(sourceSchema, value);
      } else if (sourceSchema instanceof ZodNullable) {
        pickedSchema = replaceNullish(
          sourceSchema,
          deepPick(unwrapNullish(sourceSchema) as any, value),
        );
      } else if (sourceSchema instanceof ZodOptional) {
        pickedSchema = replaceNullish(
          sourceSchema,
          deepPick(unwrapNullish(sourceSchema) as any, value),
        );
      } else {
        throw new Error(`Cannot pick ${sourceSchema?.constructor?.name}. `);
      }
      current = current.extend({
        [key]: pickedSchema,
      });
    }
  }

  return current as any;
};
