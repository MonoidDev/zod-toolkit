import {
  ZodObject,
  ZodTypeAny,
  ZodRawShape,
  ZodArray,
  ZodString,
  ZodNumber,
  ZodBoolean,
  ParsePath,
  ZodOptional,
  ZodNullable,
  ZodEffects,
  ZodEnum,
  ZodDefault,
} from "zod";

import { ZodDecoderFatalError } from "./errors";
import { SafeDecodeResult, unwrapDecodeResult } from "./types";

export interface DecodeOptions {
  passthrough?: boolean;
}

export interface DecodeContext extends Required<DecodeOptions> {
  currentPath: ParsePath;
}

export abstract class ZodDecoder<T extends ZodTypeAny, Input = unknown> {
  public constructor(public readonly schema: T) {}

  safeDecodeString(
    ctx: DecodeContext,
    input: unknown,
  ): SafeDecodeResult<unknown, string> {
    if (typeof input === "string") {
      return {
        success: true,
        data: input,
      };
    } else {
      return {
        success: false,
        input,
      };
    }
  }

  safeDecodeNumber(
    ctx: DecodeContext,
    input: unknown,
  ): SafeDecodeResult<unknown, number> {
    if (typeof input === "string") {
      // Decode string-like input

      const trimmed = input.trim();
      if (trimmed.length > 0) {
        const parsed = Number(trimmed);

        if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
          return {
            success: true,
            data: parsed,
          };
        }
      }

      return {
        success: false,
        input,
      };
    } else if (typeof input === "number") {
      return {
        success: true,
        data: input,
      };
    } else {
      return {
        success: false,
        input,
      };
    }
  }

  abstract safeDecodeBoolean(
    ctx: DecodeContext,
    input: unknown,
  ): SafeDecodeResult<unknown, boolean>;

  safeDecodeEnum(
    ctx: DecodeContext,
    type: ZodEnum<any>,
    input: unknown,
  ): SafeDecodeResult<unknown, string> {
    if (type.options.includes(input)) {
      return {
        success: true,
        data: input as string,
      };
    } else {
      return {
        success: false,
        input,
      };
    }
  }

  safeDecodeOptional(
    ctx: DecodeContext,
    type: ZodOptional<ZodTypeAny>,
    input: unknown,
  ): SafeDecodeResult<unknown, any> {
    if (input == null) {
      return {
        success: true,
        data: undefined,
      };
    } else {
      return this._safeDecode(ctx, input, type.unwrap());
    }
  }

  safeDecodeNullable(
    ctx: DecodeContext,
    type: ZodNullable<ZodTypeAny>,
    input: unknown,
  ): SafeDecodeResult<unknown, any> {
    if (input == null) {
      return {
        success: true,
        data: null,
      };
    } else {
      return this._safeDecode(ctx, input, type.unwrap());
    }
  }

  abstract safeDecodeObject(
    ctx: DecodeContext,
    type: ZodObject<ZodRawShape>,
    input: unknown,
  ): SafeDecodeResult<unknown, Record<string, any>>;

  safeDecodeArray(
    ctx: DecodeContext,
    type: ZodArray<ZodTypeAny>,
    input: unknown,
  ): SafeDecodeResult<unknown, any[]> {
    if (Array.isArray(input)) {
      const originalPath = [...ctx.currentPath];

      let hasErrors = false;

      const data = input.map((value, i) => {
        ctx.currentPath = [...originalPath, i];
        const result = this._safeDecode(ctx, value, type.element);
        if (result.success) {
          return result.data;
        } else {
          hasErrors = false;
          return result.input;
        }
      });

      if (!hasErrors) {
        return {
          success: true,
          data,
        };
      } else {
        return {
          success: false,
          input: data,
        };
      }
    } else {
      return {
        success: false,
        input,
      };
    }
  }

  safeDecodeDefault(
    ctx: DecodeContext,
    type: ZodDefault<ZodTypeAny>,
    input: unknown,
  ): SafeDecodeResult<unknown, any> {
    if (input == null) {
      return {
        success: true,
        data: undefined,
      };
    } else {
      return this._safeDecode(ctx, input, type.removeDefault());
    }
  }

  safeDecode(
    input: Input,
    options: DecodeOptions = {},
  ): SafeDecodeResult<Input, T["_input"]> {
    const ctx: DecodeContext = {
      currentPath: [],
      passthrough: options.passthrough ?? false,
    };

    return this._safeDecode(
      ctx,
      this.preprocess(input),
      this.schema,
    ) as SafeDecodeResult<Input, T["_input"]>;
  }

  decode(input: Input, options: DecodeOptions = {}): T["_input"] {
    return unwrapDecodeResult(this.safeDecode(input, options));
  }

  preprocess(input: Input): unknown {
    return input;
  }

  _safeDecode(
    ctx: DecodeContext,
    input: unknown,
    type: ZodTypeAny,
  ): SafeDecodeResult<unknown, any> {
    const safeDecodeResult = (() => {
      if (type instanceof ZodString) {
        return this.safeDecodeString(ctx, input);
      } else if (type instanceof ZodNumber) {
        return this.safeDecodeNumber(ctx, input);
      } else if (type instanceof ZodBoolean) {
        return this.safeDecodeBoolean(ctx, input);
      } else if (type instanceof ZodEnum) {
        return this.safeDecodeEnum(ctx, type, input);
      } else if (type instanceof ZodOptional) {
        return this.safeDecodeOptional(ctx, type, input);
      } else if (type instanceof ZodNullable) {
        return this.safeDecodeNullable(ctx, type, input);
      } else if (type instanceof ZodObject) {
        return this.safeDecodeObject(ctx, type, input);
      } else if (type instanceof ZodArray) {
        return this.safeDecodeArray(ctx, type, input);
      } else if (type instanceof ZodDefault) {
        return this.safeDecodeDefault(ctx, type, input);
      } else if (type instanceof ZodEffects) {
        return this._safeDecode(ctx, input, type.sourceType());
      }

      throw new ZodDecoderFatalError(
        `${type.constructor.name} is not handled. Is it supported?`,
      );
    })();

    if (safeDecodeResult.success) {
      return safeDecodeResult;
    } else if (ctx.passthrough) {
      return {
        success: true,
        data: safeDecodeResult.input,
      };
    } else {
      return safeDecodeResult;
    }
  }
}
