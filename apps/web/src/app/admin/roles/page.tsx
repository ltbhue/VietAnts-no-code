"use client";

import { getUserRole } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { ui } from "@/lib/ui";
import { FiShield } from "react-icons/fi";

export default function AdminRolesPage() {
  const role = getUserRole();

  return (
    <main className={ui.content}>
      <div className={ui.narrow}>
        <PageHeader
          title="Vai trò & quyền"
          subtitle="MVP: Admin / Tester / Viewer được kiểm tra ở API. Dưới đây là role đang lưu sau đăng nhập."
        />
        <section className={`${ui.card} flex gap-4 items-start`}>
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600/15 border border-emerald-500/25 text-emerald-400">
            <FiShield className="h-5 w-5" aria-hidden />
          </span>
          <div className="space-y-2 text-sm text-slate-300">
            <p>
              Role hiện tại:{" "}
              <strong className="text-white font-semibold">{role ?? "chưa đăng nhập"}</strong>
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Đổi quyền thực tế trên tài khoản người dùng phải thực hiện từ phía quản trị hệ thống / seed dữ liệu.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
