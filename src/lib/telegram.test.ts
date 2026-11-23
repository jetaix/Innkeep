import { describe, expect, it } from "vitest";
import { chatsIn, splitMessage } from "./telegram";

describe("splitMessage", () => {
  it("keeps a short text whole", () => {
    expect(splitMessage("one\ntwo")).toEqual(["one\ntwo"]);
  });

  it("cuts a long text at line breaks, under the limit", () => {
    const parts = splitMessage(["aaaa", "bbbb", "cccc"].join("\n"), 10);
    expect(parts).toEqual(["aaaa\nbbbb", "cccc"]);
  });
});

describe("chatsIn", () => {
  it("lists each chat once, newest first, whatever kind of update named it", () => {
    const updates = [
      { update_id: 1, message: { chat: { id: 42, type: "private", first_name: "Paul" }, text: "hi" } },
      { update_id: 2, my_chat_member: { chat: { id: -100123, type: "supergroup", title: "Ménage" } } },
      {
        update_id: 3,
        message: { chat: { id: -100123, type: "supergroup", title: "Ménage" }, text: "/start" },
      },
    ];
    expect(chatsIn(updates)).toEqual([
      { id: "-100123", title: "Ménage", kind: "group" },
      { id: "42", title: "Paul", kind: "person" },
    ]);
  });

  it("answers nothing for an empty or unexpected reply", () => {
    expect(chatsIn([])).toEqual([]);
    expect(chatsIn(null)).toEqual([]);
    expect(chatsIn([{ update_id: 1 }, null])).toEqual([]);
  });
});
