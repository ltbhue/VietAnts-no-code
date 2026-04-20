import express from "express";
import cors from "cors";
import type { PrismaClient } from "./generated/prisma/client";
import authRouter from "./routes/auth";
import projectsRouter from "./routes/projects";
import scriptsRouter from "./routes/scripts";
import objectsRouter from "./routes/objects";
import datasetsRouter from "./routes/datasets";
import runsRouter from "./routes/runs";
import testsRouter from "./routes/tests";
import suitesRouter from "./routes/suites";
import suiteRunsRouter from "./routes/suiteRuns";
import ciRouter from "./routes/ci";

export type BuildServerOptions = {
  prisma?: PrismaClient;
};

export function buildServer(options?: BuildServerOptions) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  if (options?.prisma) {
    const prisma = options.prisma;
    app.use("/auth", authRouter(prisma));
    app.use("/projects", projectsRouter(prisma));
    app.use("/scripts", scriptsRouter(prisma));
    app.use("/objects", objectsRouter(prisma));
    app.use("/datasets", datasetsRouter(prisma));
    app.use("/runs", runsRouter(prisma));
    app.use("/projects", testsRouter(prisma));
    app.use("/projects", suitesRouter(prisma));
    app.use("/suites", suiteRunsRouter(prisma));
    app.use("/ci", ciRouter(prisma));
  }

  return app;
}
