"use client";

import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { FiMail } from "react-icons/fi";
import { ui } from "@/lib/ui";

const DEFAULT_TEXTBOX_MAX_LENGTH = 255;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tokenHint, setTokenHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setTokenHint(null);
    setLoading(true);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/auth/forgot-password`, {
        email: email.trim(),
      });
      setMessage(res.data?.message ?? "Đã gửi yêu cầu quên mật khẩu.");
      if (res.data?.resetToken) {
        setTokenHint(`Mã đặt lại mật khẩu (demo): ${res.data.resetToken}`);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Không thể gửi yêu cầu quên mật khẩu");
      } else {
        setError("Không thể gửi yêu cầu quên mật khẩu");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={ui.authScreen}>
      <div className={ui.authCard}>
        <div className="mb-6 text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">Quên mật khẩu</h1>
          <p className="text-sm text-slate-400">Nhập email để tạo yêu cầu đặt lại mật khẩu.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className={ui.label} htmlFor="forgot-email">
              Email
            </label>
            <div className="relative">
              <FiMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="forgot-email"
                type="email"
                className={`${ui.input} pl-10`}
                value={email}
                onChange={(e) => setEmail(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                required
              />
            </div>
          </div>
          {error && <p className={ui.alertError}>{error}</p>}
          {message && <p className={ui.alertOk}>{message}</p>}
          {tokenHint && <p className={`${ui.alertOk} break-all`}>{tokenHint}</p>}
          <button type="submit" disabled={loading} className={`${ui.btnPrimary} w-full py-3`}>
            {loading ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/reset-password" className={ui.link}>
            Tôi đã có token đặt lại mật khẩu
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-slate-500">
          <Link href="/login" className={ui.link}>
            ← Về đăng nhập
          </Link>
        </p>
      </div>
    </main>
  );
}
