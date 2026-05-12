import { Router } from "express";
import type { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middleware/auth";
import { projectAccessibleWhere } from "../lib/projectAccess";

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_BLOCK_WINDOW_MS = 10 * 60 * 1000;

type LoginAttemptEntry = { count: number; blockedUntil: number };
const loginAttempts = new Map<string, LoginAttemptEntry>();
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const resetTokens = new Map<string, { userId: string; expiresAt: number }>();

function getLoginKey(email: string, ip: string | undefined): string {
  return `${email.toLowerCase().trim()}::${ip ?? "unknown"}`;
}

function getClientIp(rawIp: string | undefined): string | undefined {
  if (!rawIp) return undefined;
  if (rawIp.startsWith("::ffff:")) return rawIp.slice("::ffff:".length);
  return rawIp;
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Mật khẩu phải có ít nhất một chữ hoa")
    .regex(/[a-z]/, "Mật khẩu phải có ít nhất một chữ thường")
    .regex(/[0-9]/, "Mật khẩu phải có ít nhất một chữ số"),
  fullName: z.string().min(1),
  role: z.enum(["TESTER", "VIEWER"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Mật khẩu phải có ít nhất một chữ hoa")
    .regex(/[a-z]/, "Mật khẩu phải có ít nhất một chữ thường")
    .regex(/[0-9]/, "Mật khẩu phải có ít nhất một chữ số"),
});
const forgotPasswordSchema = z.object({
  email: z.string().email(),
});
const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Mật khẩu phải có ít nhất một chữ hoa")
    .regex(/[a-z]/, "Mật khẩu phải có ít nhất một chữ thường")
    .regex(/[0-9]/, "Mật khẩu phải có ít nhất một chữ số"),
});

const adminPasswordField = z
  .string()
  .min(8)
  .regex(/[A-Z]/, "Mật khẩu phải có ít nhất một chữ hoa")
  .regex(/[a-z]/, "Mật khẩu phải có ít nhất một chữ thường")
  .regex(/[0-9]/, "Mật khẩu phải có ít nhất một chữ số");

const adminUpdateUserSchema = z
  .object({
    fullName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    role: z.enum(["ADMIN", "TESTER", "VIEWER"]).optional(),
    password: adminPasswordField.optional(),
  })
  .refine((d) => d.fullName !== undefined || d.email !== undefined || d.role !== undefined || d.password !== undefined, {
    message: "Cần ít nhất một trường: fullName, email, role hoặc password",
  });

export default function authRouter(prisma: PrismaClient) {
  const router = Router();
  const jwtSecret = process.env.JWT_SECRET;

  router.post("/register", async (req, res) => {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Dữ liệu không hợp lệ", details: parse.error.flatten() });
    }
    const { email, password, fullName, role } = parse.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email đã được đăng ký" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        fullName,
        role: role ?? "TESTER",
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json(user);
  });

  router.post("/admin/create-user", authMiddleware, requireRole(["ADMIN"]), async (req, res) => {
    const parse = z
      .object({
        email: z.string().email(),
        password: z
          .string()
          .min(8)
          .regex(/[A-Z]/, "Mật khẩu phải có ít nhất một chữ hoa")
          .regex(/[a-z]/, "Mật khẩu phải có ít nhất một chữ thường")
          .regex(/[0-9]/, "Mật khẩu phải có ít nhất một chữ số"),
        fullName: z.string().min(1),
        role: z.enum(["ADMIN", "TESTER", "VIEWER"]),
        projectId: z.string().cuid().optional(),
      })
      .safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Dữ liệu không hợp lệ", details: parse.error.flatten() });
    }
    const { email, password, fullName, role, projectId } = parse.data;

    if (projectId) {
      const project = await prisma.project.findFirst({
        where: projectAccessibleWhere(req.user!.id, projectId),
        select: { id: true },
      });
      if (!project) {
        return res.status(400).json({ error: "Không tìm thấy dự án hoặc bạn không có quyền gán thành viên." });
      }
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email đã được đăng ký" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: passwordHash, fullName, role },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
    });

    if (projectId) {
      await prisma.projectMember.createMany({
        data: [{ projectId, userId: user.id }],
        skipDuplicates: true,
      });
    }

    return res.status(201).json(user);
  });

  router.post("/login", async (req, res) => {
    if (!jwtSecret) {
      return res.status(500).json({ error: "Thiếu cấu hình JWT_SECRET trên server" });
    }
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Dữ liệu không hợp lệ", details: parse.error.flatten() });
    }
    const { email, password } = parse.data;
    const attemptKey = getLoginKey(email, getClientIp(req.ip));
    const now = Date.now();
    const entry = loginAttempts.get(attemptKey);
    if (entry && entry.blockedUntil > now) {
      const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
      return res.status(429).json({
        error: `Tạm khóa đăng nhập do nhập sai nhiều lần. Vui lòng thử lại sau ${retryAfter} giây.`,
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const nextCount = (entry?.count ?? 0) + 1;
      loginAttempts.set(attemptKey, {
        count: nextCount,
        blockedUntil: nextCount >= LOGIN_MAX_ATTEMPTS ? now + LOGIN_BLOCK_WINDOW_MS : 0,
      });
      return res.status(401).json({ error: "Sai email hoặc mật khẩu" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      const nextCount = (entry?.count ?? 0) + 1;
      loginAttempts.set(attemptKey, {
        count: nextCount,
        blockedUntil: nextCount >= LOGIN_MAX_ATTEMPTS ? now + LOGIN_BLOCK_WINDOW_MS : 0,
      });
      return res.status(401).json({ error: "Sai email hoặc mật khẩu" });
    }
    loginAttempts.delete(attemptKey);

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: "8h" },
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  });

  router.get("/me", authMiddleware, async (req, res) => {
    const current = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
    });
    if (!current) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }
    return res.json(current);
  });

  router.post("/change-password", authMiddleware, async (req, res) => {
    const parse = changePasswordSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Dữ liệu không hợp lệ", details: parse.error.flatten() });
    }
    const { currentPassword, newPassword } = parse.data;
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: "Mật khẩu mới phải khác mật khẩu hiện tại" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, password: true },
    });
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Mật khẩu hiện tại không đúng" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash },
    });

    return res.json({ message: "Đổi mật khẩu thành công" });
  });

  router.post("/forgot-password", async (req, res) => {
    const parse = forgotPasswordSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Dữ liệu không hợp lệ", details: parse.error.flatten() });
    }

    const user = await prisma.user.findUnique({
      where: { email: parse.data.email },
      select: { id: true },
    });

    // Không tiết lộ email có tồn tại hay không.
    if (!user) {
      return res.json({ message: "Nếu email tồn tại, hệ thống đã tạo yêu cầu đặt lại mật khẩu." });
    }

    const token = crypto.randomBytes(24).toString("hex");
    resetTokens.set(token, {
      userId: user.id,
      expiresAt: Date.now() + RESET_TOKEN_TTL_MS,
    });

    return res.json({
      message: "Đã tạo yêu cầu đặt lại mật khẩu.",
      resetToken: token,
      expiresInSeconds: Math.floor(RESET_TOKEN_TTL_MS / 1000),
    });
  });

  router.post("/reset-password", async (req, res) => {
    const parse = resetPasswordSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Dữ liệu không hợp lệ", details: parse.error.flatten() });
    }

    const entry = resetTokens.get(parse.data.token);
    if (!entry || entry.expiresAt <= Date.now()) {
      if (entry) resetTokens.delete(parse.data.token);
      return res.status(400).json({ error: "Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." });
    }

    const passwordHash = await bcrypt.hash(parse.data.newPassword, 10);
    await prisma.user.update({
      where: { id: entry.userId },
      data: { password: passwordHash },
    });
    resetTokens.delete(parse.data.token);

    return res.json({ message: "Đặt lại mật khẩu thành công." });
  });

  router.get("/admin/users", authMiddleware, requireRole(["ADMIN"]), async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });
    return res.json(users);
  });

  router.put("/admin/users/:id", authMiddleware, requireRole(["ADMIN"]), async (req, res) => {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!userId) {
      return res.status(400).json({ error: "Thiếu id người dùng" });
    }
    const parse = adminUpdateUserSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Dữ liệu không hợp lệ", details: parse.error.flatten() });
    }
    const body = parse.data;

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });
    if (!target) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    if (body.email !== undefined && body.email !== target.email) {
      const taken = await prisma.user.findUnique({ where: { email: body.email }, select: { id: true } });
      if (taken) {
        return res.status(409).json({ error: "Email đã được sử dụng" });
      }
    }

    if (body.role !== undefined && body.role !== "ADMIN" && target.role === "ADMIN") {
      const otherAdmins = await prisma.user.count({
        where: { role: "ADMIN", id: { not: target.id } },
      });
      if (otherAdmins === 0) {
        return res.status(400).json({ error: "Không thể bỏ quyền Admin của tài khoản Admin duy nhất trong hệ thống." });
      }
    }

    if (body.role !== undefined && body.role !== "ADMIN" && target.id === req.user!.id) {
      const otherAdmins = await prisma.user.count({
        where: { role: "ADMIN", id: { not: req.user!.id } },
      });
      if (otherAdmins === 0) {
        return res.status(400).json({ error: "Phải còn ít nhất một tài khoản Admin khác trước khi bỏ quyền Admin của bạn." });
      }
    }

    const data: { fullName?: string; email?: string; role?: "ADMIN" | "TESTER" | "VIEWER"; password?: string } = {};
    if (body.fullName !== undefined) data.fullName = body.fullName;
    if (body.email !== undefined) data.email = body.email;
    if (body.role !== undefined) data.role = body.role;
    if (body.password !== undefined) {
      data.password = await bcrypt.hash(body.password, 10);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
    });
    return res.json(updated);
  });

  router.delete("/admin/users/:id", authMiddleware, requireRole(["ADMIN"]), async (req, res) => {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!userId) {
      return res.status(400).json({ error: "Thiếu id người dùng" });
    }
    if (userId === req.user!.id) {
      return res.status(400).json({ error: "Không thể xóa chính tài khoản đang đăng nhập." });
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!target) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    if (target.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: "Không thể xóa tài khoản Admin duy nhất trong hệ thống." });
      }
    }

    const ownedProjects = await prisma.project.count({ where: { ownerId: userId } });
    if (ownedProjects > 0) {
      return res.status(400).json({
        error: `Không thể xóa: người dùng đang là chủ ${ownedProjects} dự án. Hãy chuyển quyền sở hữu hoặc xóa dự án trước.`,
      });
    }

    const scriptsCreated = await prisma.testScript.count({ where: { createdById: userId } });
    if (scriptsCreated > 0) {
      return res.status(400).json({
        error: `Không thể xóa: người dùng là người tạo ${scriptsCreated} kịch bản kiểm thử.`,
      });
    }

    const runsCount = await prisma.testRun.count({ where: { userId } });
    if (runsCount > 0) {
      return res.status(400).json({
        error: `Không thể xóa: còn ${runsCount} lần chạy kiểm thử gắn với tài khoản này.`,
      });
    }

    await prisma.user.delete({ where: { id: userId } });
    return res.status(204).end();
  });

  return router;
}

