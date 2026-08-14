import { describe, expect, it } from "vitest";
import {
  getHandoffAuthorization,
  readHandoffCode,
} from "./githubSessionBridge";

describe("GitHub Pages session bridge", () => {
  const validCode = "a".repeat(43);

  it("reads a valid one-time handoff from the URL fragment only", () => {
    expect(readHandoffCode(`#handoff=${validCode}`)).toBe(validCode);
    expect(readHandoffCode(`#handoff=${validCode}&unused=value`)).toBe(validCode);
  });

  it("rejects missing, malformed and query-string handoffs", () => {
    expect(readHandoffCode("")).toBeNull();
    expect(readHandoffCode("?handoff=" + validCode)).toBeNull();
    expect(readHandoffCode("#handoff=too-short")).toBeNull();
  });

  it("adds a Bearer header only after a successful handoff redemption", () => {
    const storage = { getItem: (key: string) => (key === "dqo-api-session" ? "session-token" : null) };
    expect(getHandoffAuthorization(storage)).toEqual({ Authorization: "Bearer session-token" });
    expect(getHandoffAuthorization({ getItem: () => null })).toBeNull();
  });
});
