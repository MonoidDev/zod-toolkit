import { describe, expect, it } from "vitest";
import { ZodOptional, ZodString, z } from "zod";

import { deepPick } from "../src";

describe("objectUtils", () => {
  it("deepPick", async () => {
    const o = z.object({
      a: z.string(),
      b: z.string(),
      optional: z.string().optional(),
      nested: z.object({
        c: z.string(),
        d: z.string(),
      }),
      nestedOptional: z
        .object({
          e: z.string(),
          f: z.string(),
        })
        .optional(),
      nestedNullish: z
        .object({
          e: z.string(),
          f: z.string(),
        })
        .nullish(),
    });

    const picked = deepPick(o, {
      a: true,
      nested: {
        c: true,
      },
    });

    expect(picked.shape.a).toBeInstanceOf(ZodString);
    // @ts-expect-error
    expect(picked.shape.b).toBeUndefined();
    expect(picked.shape.nested.shape.c).toBeInstanceOf(ZodString);

    const pickedOptional = deepPick(o, {
      a: true,
      optional: true,
      nestedOptional: {
        e: true,
      },
    });

    expect(pickedOptional.shape.nestedOptional.unwrap().shape.e).toBeInstanceOf(
      ZodString,
    );
    expect(pickedOptional.shape.optional).toBeInstanceOf(ZodOptional);

    const pickedNullish = deepPick(o, {
      a: true,
      optional: true,
      nestedNullish: {
        e: true,
      },
    });

    expect(
      pickedNullish.shape.nestedNullish.unwrap().unwrap().shape.e,
    ).toBeInstanceOf(ZodString);
    expect(pickedOptional.shape.optional).toBeInstanceOf(ZodOptional);

    const pickedObject = deepPick(o, {
      nested: true,
    });

    expect(pickedObject.shape.nested.shape.c).toBeInstanceOf(ZodString);
    expect(pickedObject.shape.nested.shape.d).toBeInstanceOf(ZodString);
  });
});
