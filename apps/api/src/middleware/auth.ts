import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthUser {
  id: string;
  email: string;
  role: "ADMIN" | "TESTER" | "VIEWER";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Thiếu header xác thực" });
  }
  const token = header.slice("Bearer ".length);
  const jwtSecret = process.env.JWT_SECRET || "CHANGE_ME_IN_PRODUCTION";

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthUser & { sub?: string };
    req.user = {
      id: decoded.sub ?? decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Token không hợp lệ" });
  }
}

export function requireRole(roles: AuthUser["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Chưa đăng nhập" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Không đủ quyền" });
    next();
  };
}

