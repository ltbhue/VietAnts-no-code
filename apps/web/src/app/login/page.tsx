"use client";

import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiLock, FiMail } from "react-icons/fi";
import { ui } from "@/lib/ui";

const DEFAULT_TEXTBOX_MAX_LENGTH = 255;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/auth/login`, {
        email,
        password,
      });
      localStorage.setItem("authToken", res.data.token);
      localStorage.setItem("authUser", JSON.stringify(res.data.user));
      router.push("/dashboard");
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && !err.response) {
        setError(
          "Không kết nối được API (http://localhost:4000). Hãy bật server API trong thư mục đồ án (pnpm dev:api).",
        );
      } else if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Đăng nhập thất bại");
      } else {
        setError("Đăng nhập thất bại");
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
          <h1 className="text-2xl font-bold text-white">Đăng nhập</h1>
          <p className="text-sm text-slate-400">Kiểm thử không cần viết mã — quản lý kịch bản và báo cáo chạy thử.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className={ui.label} htmlFor="login-email">
              Email
            </label>
            <div className="relative">
              <FiMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="login-email"
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
            <label className={ui.label} htmlFor="login-password">
              Mật khẩu
            </label>
            <div className="relative">
              <FiLock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                className={`${ui.input} pl-10`}
                value={password}
                onChange={(e) => setPassword(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                required
              />
            </div>
          </div>
          {error && <p className={`${ui.alertError}`}>{error}</p>}
          <button type="submit" disabled={loading} className={`${ui.btnPrimary} w-full py-3`}>
            {loading ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Chưa có tài khoản?{" "}
          <Link href="/register" className={ui.link}>
            Đăng ký
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-slate-500">
          <Link href="/forgot-password" className={ui.link}>
            Quên mật khẩu?
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-slate-500">
          <Link href="/" className={ui.link}>
            ← Về trang giới thiệu
          </Link>
        </p>
      </div>
    </main>
  );
}
