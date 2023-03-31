import { ZodTypeAny, ZodEffects, ZodNullable, ZodOptional } from "zod";

export const unwrapZodType = (t: ZodTypeAny): ZodTypeAny => {
  if (t instanceof ZodEffects) {
    return unwrapZodType(t.innerType());
  } else if (t instanceof ZodNullable || t instanceof ZodOptional) {
    return unwrapZodType(t.unwrap());
  }
  return t;
};
