import { describe, expect, it } from "vitest";
import { z } from "zod";

import { QueryDecoder } from "../src/QueryDecoder";

describe("QueryDecoder", () => {
  it("should decode string object", () => {
    expect(
      new QueryDecoder(z.object({ a: z.string() })).decode("a=a"),
    ).toMatchObject({
      a: "a",
    });

    expect(
      new QueryDecoder(z.object({ a: z.string(), b: z.string() })).decode(
        "a=a&b=b",
      ),
    ).toMatchObject({
      a: "a",
      b: "b",
    });

    expect(
      new QueryDecoder(z.object({ a: z.string() })).decode("a="),
    ).toMatchObject({
      a: "",
    });

    expect(
      new QueryDecoder(z.object({ a: z.string() })).safeDecode(""),
    ).toMatchObject({
      success: false,
      input: {
        a: null,
      },
    });
  });

  it("should decode number object", () => {
    expect(
      new QueryDecoder(z.object({ a: z.number() })).decode("a=1"),
    ).toMatchObject({
      a: 1,
    });

    expect(
      new QueryDecoder(z.object({ a: z.number() })).decode("a=114514.114514"),
    ).toMatchObject({
      a: 114514.114514,
    });

    expect(
      new QueryDecoder(z.object({ a: z.number() })).safeDecode("a=xxx"),
    ).toMatchObject({
      success: false,
      input: {
        a: "xxx",
      },
    });

    expect(
      new QueryDecoder(z.object({ a: z.number() })).safeDecode("a=1px"),
    ).toMatchObject({
      success: false,
      input: {
        a: "1px",
      },
    });
  });

  it("should decode boolean", () => {
    expect(
      new QueryDecoder(z.object({ a: z.boolean() })).decode("a=true"),
    ).toMatchObject({
      a: true,
    });

    expect(
      new QueryDecoder(z.object({ a: z.boolean() })).decode("a=false"),
    ).toMatchObject({
      a: false,
    });
  });

  it("should decode enum", () => {
    expect(
      new QueryDecoder(z.object({ a: z.enum(["A", "B", "C"]) })).decode("a=C"),
    ).toMatchObject({
      a: "C",
    });
  });

  it("should decode array", () => {
    expect(
      new QueryDecoder(z.object({ a: z.string().array() })).decode("a=a"),
    ).toMatchObject({
      a: ["a"],
    });

    expect(
      new QueryDecoder(z.object({ a: z.string().array() })).decode(
        "a=a&a=b&a=c",
      ),
    ).toMatchObject({
      a: ["a", "b", "c"],
    });
  });

  it("should decode optional", () => {
    expect(
      new QueryDecoder(z.object({ a: z.string().optional() })).decode("a=a"),
    ).toMatchObject({
      a: "a",
    });

    expect(
      new QueryDecoder(z.object({ a: z.string().optional() })).decode(""),
    ).toMatchObject({
      a: undefined,
    });

    expect(
      new QueryDecoder(z.object({ a: z.string().nullable() })).decode(""),
    ).toMatchObject({
      a: null,
    });

    expect(
      new QueryDecoder(z.object({ a: z.string().nullable() })).decode(
        "c=1&c=2&d=114514s",
      ),
    ).toMatchObject({
      a: null,
    });
  });

  it("should go through effects", () => {
    expect(
      new QueryDecoder(
        z.object({ a: z.string().transform((s) => s.length) }),
      ).decode("a=a"),
    ).toMatchObject({
      a: "a",
    });
  });
});
