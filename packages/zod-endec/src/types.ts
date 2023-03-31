import { ZodDecoderDecodeError } from "./errors";

export type SafeDecodeResultSuccess<Decoded> = {
  success: true;
  data: Decoded;
};

export type SafeDecodeResultError<RawInput> = {
  success: false;
  input: RawInput;
};

export type SafeDecodeResult<RawInput, Decoded> =
  | SafeDecodeResultSuccess<Decoded>
  | SafeDecodeResultError<RawInput>;

/**
 *
 * @param result
 * @returns The data if success, throws if ZodDecoderDecodeError not.
 */
export const unwrapDecodeResult = <RawInput, Decoded>(
  result: SafeDecodeResult<RawInput, Decoded>,
): Decoded => {
  if (result.success) {
    return result.data;
  } else {
    throw new ZodDecoderDecodeError(result);
  }
};
