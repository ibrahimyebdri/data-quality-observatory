import { createHash } from "crypto";

export const HANDOFF_CODE_PATTERN = /^[A-Za-z0-9_-]{40,100}$/;

export function hashHandoffCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

type HandoffRecord = { openId: string } | null;

export type HandoffRedeemer = {
  consume: (codeHash: string) => Promise<HandoffRecord>;
  getName: (openId: string) => Promise<string>;
  issueSession: (openId: string, name: string) => Promise<string>;
};

/**
 * Redeems one opaque code exactly once and returns a bearer session. The route
 * owns HTTP errors; this pure service owns validity and one-time semantics.
 */
export async function redeemOAuthHandoff(code: string, services: HandoffRedeemer) {
  if (!HANDOFF_CODE_PATTERN.test(code)) return null;

  const handoff = await services.consume(hashHandoffCode(code));
  if (!handoff) return null;

  const name = await services.getName(handoff.openId);
  const sessionToken = await services.issueSession(handoff.openId, name);
  return { openId: handoff.openId, sessionToken };
}
