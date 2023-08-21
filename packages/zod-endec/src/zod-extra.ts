import {
  ZodTypeAny,
  ZodEffects,
  ZodNullable,
  ZodOptional,
  ZodDefault,
} from "zod";

export const unwrapZodType = (t: ZodTypeAny): ZodTypeAny => {
  if (t instanceof ZodEffects) {
    return unwrapZodType(t.innerType());
  } else if (t instanceof ZodNullable || t instanceof ZodOptional) {
    return unwrapZodType(t.unwrap());
  } else if (t instanceof ZodDefault) {
    return unwrapZodType(t.removeDefault());
  }
  return t;
};
