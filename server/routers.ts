import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { profileCsv } from "./quality-engine";
import { createDatasetRun, getWorkspaceOverview, markNotificationRead } from "./quality-db";
import { storagePut } from "./storage";

const importInput = z.object({
  fileName: z.string().trim().min(1).max(255),
  content: z.string().min(1).max(2_000_000),
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  quality: router({
    overview: protectedProcedure.query(({ ctx }) => getWorkspaceOverview(ctx.user.id)),
    importCsv: protectedProcedure.input(importInput).mutation(async ({ ctx, input }) => {
      if (!input.fileName.toLowerCase().endsWith(".csv")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only CSV files are supported in this version." });
      }

      const startedAt = Date.now();
      let report;
      try {
        report = profileCsv(input.content);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "The CSV could not be profiled.",
        });
      }

      const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const stored = await storagePut(`quality-datasets/${ctx.user.id}/${safeFileName}`, input.content, "text/csv");
      const created = await createDatasetRun({
        ownerId: ctx.user.id,
        name: input.fileName.replace(/\.csv$/i, ""),
        sourceFileKey: stored.key,
        sourceFileUrl: stored.url,
        report,
        durationMs: Date.now() - startedAt,
      });

      return { ...created, report };
    }),
    markNotificationRead: protectedProcedure.input(z.object({ notificationId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await markNotificationRead(ctx.user.id, input.notificationId);
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
