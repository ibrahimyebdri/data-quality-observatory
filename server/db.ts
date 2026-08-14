import { and, eq, gt, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { authHandoffs, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/** Stores the digest of a short-lived code, never the code itself or a session token. */
export async function createAuthHandoff(input: {
  codeHash: string;
  openId: string;
  expiresAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable for OAuth handoff");
  await db.insert(authHandoffs).values(input);
}

/** Atomically claims an unexpired one-time code and returns its associated user. */
export async function consumeAuthHandoff(codeHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable for OAuth handoff");

  const now = new Date();
  const row = await db
    .select({ openId: authHandoffs.openId })
    .from(authHandoffs)
    .where(
      and(
        eq(authHandoffs.codeHash, codeHash),
        isNull(authHandoffs.consumedAt),
        gt(authHandoffs.expiresAt, now),
      ),
    )
    .limit(1);

  if (!row[0]) return null;

  const result = (await db
    .update(authHandoffs)
    .set({ consumedAt: now })
    .where(
      and(
        eq(authHandoffs.codeHash, codeHash),
        isNull(authHandoffs.consumedAt),
        gt(authHandoffs.expiresAt, now),
      ),
    )) as unknown as { affectedRows?: number };

  if (result.affectedRows !== 1) return null;
  return row[0];
}

// TODO: add feature queries here as your schema grows.
