import dotenv from "dotenv";
import { buildServer } from "./server";
import { prisma } from "./prisma";

dotenv.config();
if (!process.env.JWT_SECRET) {
  throw new Error("Missing required env var JWT_SECRET");
}

const app = buildServer({ prisma });
const parsedPort = Number(process.env.API_PORT ?? 4000);
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 4000;

const server = app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});

server.on("error", (error) => {
  console.error("Failed to start API server:", error);
  process.exit(1);
});


