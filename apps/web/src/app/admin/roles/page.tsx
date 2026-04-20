"use client";

import { getUserRole } from "@/lib/api";

export default function AdminRolesPage() {
  const role = getUserRole();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold text-emerald-400">Vai trò (RBAC)</h1>
      <p className="text-slate-400 text-sm">
        MVP: Admin / Editor (TESTER+ADMIN) / Viewer được áp dụng ở API. Trang này chỉ hiển thị role hiện tại từ localStorage sau đăng nhập.
      </p>
      <div className="rounded border border-slate-800 bg-slate-900/80 p-4 text-sm">
        <p>
          Role hiện tại:{" "}
          <strong className="text-emerald-300">{role ?? "chưa đăng nhập"}</strong>
        </p>
      </div>
    </div>
  );
}
