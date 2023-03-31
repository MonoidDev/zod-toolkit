import { SafeDecodeResultError } from "./types";

export class ZodDecoderFatalError extends Error {}

export class ZodDecoderDecodeError extends Error {
  constructor(public result: SafeDecodeResultError<any>) {
    super(`Decode error: got unexpected rawInput ${result.input}`);
  }
}
