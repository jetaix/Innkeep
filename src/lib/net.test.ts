import { describe, expect, it } from "vitest";
import { isPrivateAddress } from "./net";

describe("isPrivateAddress", () => {
  it("recognises this computer and local networks", () => {
    for (const origin of [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://[::1]:3000",
      "http://192.168.1.20:3000",
      "http://10.0.0.5",
      "http://172.20.1.1",
      "http://innkeep.local",
    ]) {
      expect(isPrivateAddress(origin), origin).toBe(true);
    }
  });

  it("lets public addresses through", () => {
    expect(isPrivateAddress("https://innkeep.example.com")).toBe(false);
    expect(isPrivateAddress("https://172.32.0.1")).toBe(false);
    expect(isPrivateAddress("https://8.8.8.8")).toBe(false);
  });
});
