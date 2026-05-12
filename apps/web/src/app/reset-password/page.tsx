"use client";

import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ui } from "@/lib/ui";

const DEFAULT_TEXTBOX_MAX_LENGTH = 255;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/auth/reset-password`, {
        token: token.trim(),
        newPassword,
      });
      setSuccess("Đặt lại mật khẩu thành công. Đang chuyển về đăng nhập...");
      setTimeout(() => router.push("/login"), 900);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Đặt lại mật khẩu thất bại");
      } else {
        setError("Đặt lại mật khẩu thất bại");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={ui.content}>
      <div className={ui.narrow}>
        <section className={ui.authCard}>
          <div className="mb-6 text-center space-y-2">
            <h1 className="text-2xl font-bold text-white">Đặt lại mật khẩu</h1>
            <p className="text-sm text-slate-400">Dán mã đặt lại mật khẩu và nhập mật khẩu mới.</p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className={ui.label} htmlFor="reset-token">
                Token đặt lại mật khẩu
              </label>
              <input
                id="reset-token"
                className={`${ui.input} font-mono text-xs`}
                value={token}
                onChange={(e) => setToken(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                required
              />
            </div>
            <div>
              <label className={ui.label} htmlFor="reset-password-new">
                Mật khẩu mới
              </label>
              <input
                id="reset-password-new"
                type="password"
                className={ui.input}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                required
              />
            </div>
            <div>
              <label className={ui.label} htmlFor="reset-password-confirm">
                Xác nhận mật khẩu mới
              </label>
              <input
                id="reset-password-confirm"
                type="password"
                className={ui.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                required
              />
            </div>
            {error && <p className={ui.alertError}>{error}</p>}
            {success && <p className={ui.alertOk}>{success}</p>}
            <button type="submit" disabled={loading} className={`${ui.btnPrimary} w-full py-3`}>
              {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            <Link href="/forgot-password" className={ui.link}>
              Chưa có token? Yêu cầu quên mật khẩu
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
