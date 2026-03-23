import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import authRouter from "./routes/auth";
import projectsRouter from "./routes/projects";
import scriptsRouter from "./routes/scripts";
import objectsRouter from "./routes/objects";
import datasetsRouter from "./routes/datasets";
import runsRouter from "./routes/runs";

dotenv.config();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", service: "vietants-nocode-api" });
});

app.use("/auth", authRouter(prisma));
app.use("/projects", projectsRouter(prisma));
app.use("/scripts", scriptsRouter(prisma));
app.use("/objects", objectsRouter(prisma));
app.use("/datasets", datasetsRouter(prisma));
app.use("/runs", runsRouter(prisma));

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});


