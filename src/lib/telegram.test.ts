import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { chatsIn, requestJson, splitMessage } from "./telegram";

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

describe("requestJson", () => {
  // Answers at once, except on /slow, where it never does.
  const server = createServer((request, response) => {
    if (request.url === "/slow") return;
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      response.writeHead(request.url === "/refused" ? 400 : 200, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({ description: "chat not found", result: { method: request.method, body } }),
      );
    });
  });
  let origin = "";
  beforeAll(async () => {
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => {
    server.closeAllConnections();
    server.close();
  });

  it("posts a body as JSON and reads the answer", async () => {
    const answer = await requestJson(new URL(`${origin}/sendMessage`), { text: "hi" });
    expect(answer).toEqual({
      status: 200,
      data: { description: "chat not found", result: { method: "POST", body: '{"text":"hi"}' } },
    });
  });

  it("hands back a refusal with its explanation instead of throwing", async () => {
    const answer = await requestJson(new URL(`${origin}/refused`));
    expect(answer.status).toBe(400);
    expect(answer.data?.description).toBe("chat not found");
  });

  it("gives up on a server that never answers", async () => {
    await expect(requestJson(new URL(`${origin}/slow`), undefined, 200)).rejects.toThrow(
      "did not answer in time",
    );
  });
});
