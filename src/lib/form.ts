import { z } from "zod";

/** Validates a submitted form against a schema. Field names are the schema keys. */
export function parseForm<Schema extends z.ZodType>(schema: Schema, form: FormData) {
  return schema.safeParse(Object.fromEntries(form));
}

export const text = z.string().trim();
export const isoDate = z.iso.date();
export const wholeNumber = (min = 0) => z.coerce.number().int().min(min);

/** An optional field that arrives as "" when left blank. */
export const blankAsNull = <Schema extends z.ZodType>(schema: Schema) =>
  z.preprocess((value) => (value === "" || value == null ? null : value), schema.nullable());
