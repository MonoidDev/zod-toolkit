import { describe, expect, it } from "vitest";
import { ZodNumber, z } from "zod";

import { replaceNullish, unwrapNullish } from "../src";

describe("nullishUtils", () => {
  it("should unwrap nullish into its innest type", () => {
    const stringType: z.ZodString = unwrapNullish(
      z.string().nullable().optional().nullable().optional(),
    );

    expect(stringType.parse("")).toBe("");

    const numberType: z.ZodNumber = unwrapNullish(z.number().nullish());
    expect(numberType.parse(1)).toBe(1);
  });

  it("should replace nullish for its innest type", () => {
    const numberType = replaceNullish(
      z.string().nullable().optional().nullable().optional(),
      z.number(),
    );

    expect(numberType.parse(1)).toBe(1);

    expect(numberType.parse(null)).toBe(null);

    expect(numberType.parse(undefined)).toBe(undefined);

    expect(numberType.unwrap().unwrap().unwrap().unwrap()).toBeInstanceOf(
      ZodNumber,
    );
  });
});
