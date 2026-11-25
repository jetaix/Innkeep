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

/** What was sent does not fit what the change needs. `field` names the first thing wrong, when one field is. */
export class InvalidInput extends Error {
  constructor(readonly field: string | null = null) {
    super(field ? `Check "${field}".` : "Check what was entered.");
    this.name = "InvalidInput";
  }
}

/** Validates what a form or a request sent, or throws `InvalidInput`. */
export function parse<Schema extends z.ZodType>(schema: Schema, input: unknown): z.output<Schema> {
  const parsed = schema.safeParse(input);
  if (parsed.success) return parsed.data;
  const first = parsed.error.issues[0]?.path[0];
  throw new InvalidInput(typeof first === "string" ? first : null);
}

/**
 * Runs a change and says whether it happened. A form that sent something
 * invalid is left as it is, without an error page: the fields say what they need.
 */
export async function applied(change: () => Promise<unknown>): Promise<boolean> {
  try {
    await change();
    return true;
  } catch (error) {
    if (error instanceof InvalidInput) return false;
    throw error;
  }
}

/** The fields of a submitted form, as a plain object. */
export const fields = (form: FormData) => Object.fromEntries(form);
