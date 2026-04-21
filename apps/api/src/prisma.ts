import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Thiếu cấu hình DATABASE_URL để khởi động API với cơ sở dữ liệu.");
}

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
