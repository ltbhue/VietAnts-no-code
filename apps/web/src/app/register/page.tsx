"use client";

import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiLock, FiMail, FiUser } from "react-icons/fi";
import { ui } from "@/lib/ui";

const DEFAULT_TEXTBOX_MAX_LENGTH = 255;

type Role = "TESTER" | "VIEWER";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("TESTER");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/auth/register`, {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role,
      });
      setSuccess("Đăng ký thành công. Đang chuyển sang trang đăng nhập...");
      setTimeout(() => router.push("/login"), 800);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && !err.response) {
        setError(
          "Không kết nối được API (http://localhost:4000). Hãy bật server API trong thư mục đồ án (pnpm dev:api).",
        );
      } else if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Đăng ký thất bại");
      } else {
        setError("Đăng ký thất bại");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={ui.authScreen}>
      <div className={ui.authCard}>
        <div className="mb-6 text-center space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500/90">Vietants</p>
          <h1 className="text-2xl font-bold text-white">Đăng ký tài khoản</h1>
          <p className="text-sm text-slate-400">Tạo tài khoản để sử dụng hệ thống kiểm thử no-code.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className={ui.label} htmlFor="register-name">
              Họ và tên
            </label>
            <div className="relative">
              <FiUser className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="register-name"
                type="text"
                className={`${ui.input} pl-10`}
                value={fullName}
                onChange={(e) => setFullName(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                required
              />
            </div>
          </div>
          <div>
            <label className={ui.label} htmlFor="register-email">
              Email
            </label>
            <div className="relative">
              <FiMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                className={`${ui.input} pl-10`}
                value={email}
                onChange={(e) => setEmail(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                required
              />
            </div>
          </div>
          <div>
            <label className={ui.label} htmlFor="register-password">
              Mật khẩu
            </label>
            <div className="relative">
              <FiLock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                className={`${ui.input} pl-10`}
                value={password}
                onChange={(e) => setPassword(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                required
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số.</p>
          </div>
          <div>
            <label className={ui.label} htmlFor="register-role">
              Vai trò
            </label>
            <select
              id="register-role"
              className={ui.select}
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option value="TESTER">Kiểm thử viên</option>
              <option value="VIEWER">Người xem</option>
            </select>
          </div>
          {error && <p className={ui.alertError}>{error}</p>}
          {success && <p className={ui.alertOk}>{success}</p>}
          <button type="submit" disabled={loading} className={`${ui.btnPrimary} w-full py-3`}>
            {loading ? "Đang đăng ký…" : "Đăng ký"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Đã có tài khoản?{" "}
          <Link href="/login" className={ui.link}>
            Đăng nhập
          </Link>
        </p>
      </div>
    </main>
  );
}
