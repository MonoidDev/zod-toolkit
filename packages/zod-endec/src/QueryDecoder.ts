import { ZodArray, ZodObject, ZodRawShape, ZodTypeAny } from "zod";

import { SafeDecodeResult } from "./types";
import { unwrapZodType } from "./zod-extra";
import { DecodeContext, ZodDecoder } from "./ZodDecoder";

export type QueryDecoderInput =
  | string
  | URLSearchParams
  | string[][]
  | Record<string, string>
  | undefined;

export interface QueryDecoderOptions {
  safeDecodeBoolean: (input: unknown) => SafeDecodeResult<unknown, boolean>;
}

export class QueryDecoder<T extends ZodTypeAny> extends ZodDecoder<
  T,
  QueryDecoderInput
> {
  public constructor(
    public readonly schema: T,
    private _options: Partial<QueryDecoderOptions> = {},
  ) {
    super(schema);
  }

  get options(): QueryDecoderOptions {
    return {
      safeDecodeBoolean:
        this._options.safeDecodeBoolean ??
        function (input) {
          try {
            const parsed = JSON.parse(String(input));

            if (typeof parsed === "boolean") {
              return {
                success: true,
                data: parsed,
              };
            } else {
              return {
                success: false,
                input,
              };
            }
          } catch (e) {
            return {
              success: false,
              input,
            };
          }
        },
    };
  }

  preprocess(input: QueryDecoderInput): unknown {
    return new URLSearchParams(input as any);
  }

  safeDecodeBoolean(
    ctx: DecodeContext,
    input: unknown,
  ): SafeDecodeResult<unknown, boolean> {
    return this.options.safeDecodeBoolean(input);
  }

  safeDecodeObject(
    ctx: DecodeContext,
    type: ZodObject<ZodRawShape>,
    input: URLSearchParams,
  ): SafeDecodeResult<unknown, Record<string, any>> {
    const originalPath = [...ctx.currentPath];
    const data: Record<string, any> = {};

    let hasErrors = false;

    for (const [key, childType] of Object.entries(type.shape)) {
      ctx.currentPath = [...originalPath, key];

      const unwrappedChildType = unwrapZodType(childType);

      const keyDecodeResult = this._safeDecode(
        ctx,
        unwrappedChildType instanceof ZodArray
          ? input.getAll(key)
          : input.get(key),
        childType,
      );

      if (keyDecodeResult.success) {
        data[key] = keyDecodeResult.data;
      } else {
        hasErrors = true;
        data[key] = keyDecodeResult.input;
      }
    }

    ctx.currentPath = originalPath;
    if (!hasErrors) {
      return { success: true, data };
    } else {
      return {
        success: false,
        input: data,
      };
    }
  }
}
