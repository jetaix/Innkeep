import { describe, expect, it } from "vitest";
import { splitMessage } from "./telegram";

describe("splitMessage", () => {
  it("keeps a short text whole", () => {
    expect(splitMessage("one\ntwo")).toEqual(["one\ntwo"]);
  });

  it("cuts a long text at line breaks, under the limit", () => {
    const parts = splitMessage(["aaaa", "bbbb", "cccc"].join("\n"), 10);
    expect(parts).toEqual(["aaaa\nbbbb", "cccc"]);
  });
});
