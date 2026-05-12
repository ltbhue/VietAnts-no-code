"use client";

import { useState } from "react";
import axios from "axios";
import { getApiBase } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { ui } from "@/lib/ui";

const DEFAULT_TEXTBOX_MAX_LENGTH = 255;

export default function AccountSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      await axios.post(
        `${getApiBase()}/auth/change-password`,
        { currentPassword, newPassword },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      setSuccess("Đổi mật khẩu thành công.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Đổi mật khẩu thất bại");
      } else {
        setError("Đổi mật khẩu thất bại");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={ui.content}>
      <div className={ui.narrow}>
        <PageHeader
          title="Tài khoản"
          subtitle="Đổi mật khẩu để tăng an toàn khi sử dụng hệ thống."
        />
        <section className={`${ui.card} space-y-4`}>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className={ui.label} htmlFor="current-password">
                Mật khẩu hiện tại
              </label>
              <input
                id="current-password"
                type="password"
                className={ui.input}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                required
              />
            </div>
            <div>
              <label className={ui.label} htmlFor="new-password">
                Mật khẩu mới
              </label>
              <input
                id="new-password"
                type="password"
                className={ui.input}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                required
              />
              <p className="mt-1 text-xs text-slate-500">Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số.</p>
            </div>
            <div>
              <label className={ui.label} htmlFor="confirm-password">
                Xác nhận mật khẩu mới
              </label>
              <input
                id="confirm-password"
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

            <button type="submit" disabled={loading} className={ui.btnPrimary}>
              {loading ? "Đang cập nhật..." : "Đổi mật khẩu"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
